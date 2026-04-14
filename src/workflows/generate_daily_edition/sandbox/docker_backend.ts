import { env } from '$env/dynamic/private';
import Dockerode from 'dockerode';
import path from 'node:path';
import { Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { pack, type Headers, type Pack } from 'tar-stream';
import { default_docker_sandbox_image, docker_sandbox_workspace } from './shared';
import type {
	sandbox_backend,
	sandbox_command_handle,
	sandbox_command_result,
	sandbox_create_config,
	sandbox_file,
	sandbox_run_command_params,
	workflow_sandbox
} from './types';

const noop_writable = new Writable({
	write(_chunk, _encoding, callback) {
		callback();
	}
});

let docker_client: Dockerode | undefined;

function get_docker_client() {
	docker_client ??= new Dockerode();
	return docker_client;
}

function to_env_list(values?: Record<string, string>) {
	if (!values) return undefined;
	return Object.entries(values).map(([key, value]) => `${key}=${value}`);
}

function is_docker_not_found_error(error: unknown) {
	if (typeof error !== 'object' || error === null) {
		return false;
	}

	const status_code = 'statusCode' in error ? error.statusCode : undefined;
	if (status_code === 404) {
		return true;
	}

	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return message.includes('no such container') || message.includes('no such exec instance');
}

function is_nonfatal_stop_error(error: unknown) {
	if (is_docker_not_found_error(error)) {
		return true;
	}

	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return message.includes('is not running') || message.includes('container already stopped');
}

function sanitize_relative_path(file_path: string) {
	if (!file_path) {
		throw new Error('Sandbox file path must be non-empty');
	}

	if (path.posix.isAbsolute(file_path)) {
		throw new Error(`Sandbox file path must be relative: ${file_path}`);
	}

	const normalized_path = path.posix.normalize(file_path);
	if (
		normalized_path === '.' ||
		normalized_path === '..' ||
		normalized_path.startsWith('../') ||
		normalized_path.includes('/../')
	) {
		throw new Error(`Sandbox file path must not contain parent traversal: ${file_path}`);
	}

	return normalized_path;
}

function compare_directory_paths(left: string, right: string) {
	const depth_difference = left.split('/').length - right.split('/').length;
	if (depth_difference !== 0) {
		return depth_difference;
	}

	return left.localeCompare(right);
}

function add_tar_entry(archive: Pack, header: Headers, content?: Buffer) {
	return new Promise<void>((resolve, reject) => {
		const callback = (error?: Error | null) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		};

		if (content) {
			archive.entry(header, content, callback);
			return;
		}

		archive.entry(header, callback);
	});
}

async function create_tar_archive(files: sandbox_file[]) {
	const archive = pack();
	const directory_paths = new Set<string>();
	const normalized_files = files.map((file) => {
		const normalized_path = sanitize_relative_path(file.path);
		const content = Buffer.from(file.content);

		let parent_directory = path.posix.dirname(normalized_path);
		while (parent_directory !== '.') {
			directory_paths.add(parent_directory);
			parent_directory = path.posix.dirname(parent_directory);
		}

		return {
			path: normalized_path,
			content,
			mode: file.mode ?? 0o644
		};
	});

	for (const directory_path of [...directory_paths].sort(compare_directory_paths)) {
		await add_tar_entry(archive, {
			name: directory_path,
			type: 'directory',
			mode: 0o755
		});
	}

	for (const file of normalized_files) {
		await add_tar_entry(
			archive,
			{
				name: file.path,
				type: 'file',
				mode: file.mode,
				size: file.content.length
			},
			file.content
		);
	}

	archive.finalize();
	return archive;
}

async function follow_progress(docker: Dockerode, stream: NodeJS.ReadableStream) {
	await new Promise<void>((resolve, reject) => {
		docker.modem.followProgress(stream, (error) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});
}

async function ensure_docker_available(docker: Dockerode) {
	try {
		await docker.ping();
	} catch (error) {
		throw new Error(
			`Docker sandbox backend is unavailable: ${error instanceof Error ? error.message : 'Unknown Docker error'}`
		);
	}
}

async function ensure_image_available(docker: Dockerode, image_name: string) {
	try {
		await docker.getImage(image_name).inspect();
	} catch (error) {
		if (!is_docker_not_found_error(error)) {
			throw error;
		}

		const pull_stream = await docker.pull(image_name, {});
		await follow_progress(docker, pull_stream);
	}
}

function wait_for_stream(stream: NodeJS.ReadableStream) {
	return new Promise<void>((resolve, reject) => {
		let settled = false;

		const complete = (error?: Error) => {
			if (settled) {
				return;
			}

			settled = true;
			if (error) {
				reject(error);
				return;
			}

			resolve();
		};

		stream.once('error', (error) =>
			complete(error instanceof Error ? error : new Error(String(error)))
		);
		stream.once('end', () => complete());
		stream.once('close', () => complete());
	});
}

function stream_exec_output(
	docker: Dockerode,
	stream: NodeJS.ReadableStream,
	params: Pick<sandbox_run_command_params, 'stdout' | 'stderr'>
) {
	if (!params.stdout && !params.stderr) {
		stream.resume();
		return wait_for_stream(stream);
	}

	docker.modem.demuxStream(stream, params.stdout ?? noop_writable, params.stderr ?? noop_writable);
	return wait_for_stream(stream);
}

async function wait_for_exec(exec: Dockerode.Exec): Promise<sandbox_command_result> {
	while (true) {
		const exec_info = await exec.inspect();
		if (!exec_info.Running) {
			return {
				id: exec.id,
				exit_code: exec_info.ExitCode ?? 1,
				wait: async () => wait_for_exec(exec)
			} satisfies sandbox_command_result;
		}

		await delay(200);
	}
}

function create_exec_command_handle(exec: Dockerode.Exec): sandbox_command_handle {
	return {
		id: exec.id,
		wait: async () => wait_for_exec(exec)
	};
}

function wrap_container(container: Dockerode.Container): workflow_sandbox {
	const docker = get_docker_client();

	async function runCommand(
		params: sandbox_run_command_params & { detached: true }
	): Promise<sandbox_command_handle>;
	async function runCommand(
		params: sandbox_run_command_params & { detached?: false | undefined }
	): Promise<sandbox_command_result>;
	async function runCommand(params: sandbox_run_command_params) {
		const exec = await container.exec({
			AttachStdout: true,
			AttachStderr: true,
			Cmd: [params.cmd, ...(params.args ?? [])],
			Env: to_env_list(params.env),
			Privileged: params.sudo,
			WorkingDir: docker_sandbox_workspace,
			Tty: false
		});

		const stream = await exec.start({ Detach: false, Tty: false });

		if (params.detached) {
			void stream_exec_output(docker, stream, params).catch((error) => {
				console.error(`[sandbox:${container.id}] Failed to stream Docker exec output:`, error);
			});

			return create_exec_command_handle(exec);
		}

		const [result] = await Promise.all([
			wait_for_exec(exec),
			stream_exec_output(docker, stream, params)
		]);

		return result;
	}

	return {
		id: container.id,
		async writeFiles(files) {
			await container.putArchive(await create_tar_archive(files), {
				path: docker_sandbox_workspace
			});
		},
		runCommand,
		async getCommand(id) {
			const exec = docker.getExec(id);
			await exec.inspect();
			return create_exec_command_handle(exec);
		}
	};
}

async function create_docker_sandbox(config: sandbox_create_config) {
	const docker = get_docker_client();
	const image_name = env.DOCKER_SANDBOX_IMAGE || default_docker_sandbox_image;
	let container: Dockerode.Container | undefined;

	await ensure_docker_available(docker);
	await ensure_image_available(docker, image_name);

	try {
		container = await docker.createContainer({
			Image: image_name,
			Cmd: ['sh', '-lc', `mkdir -p ${docker_sandbox_workspace} && exec sleep infinity`],
			WorkingDir: docker_sandbox_workspace,
			Env: to_env_list(config.env),
			HostConfig: {
				...(env.DOCKER_SANDBOX_NETWORK ? { NetworkMode: env.DOCKER_SANDBOX_NETWORK } : {})
			}
		});
		await container.start();
		return container;
	} catch (error) {
		if (container) {
			await docker_sandbox_backend.stop(container.id).catch(() => undefined);
		}

		throw error;
	}
}

export const docker_sandbox_backend: sandbox_backend = {
	name: 'docker',
	async create(config) {
		return wrap_container(await create_docker_sandbox(config));
	},
	async get(id) {
		const container = get_docker_client().getContainer(id);
		await container.inspect();
		return wrap_container(container);
	},
	async stop(id) {
		const container = get_docker_client().getContainer(id);

		try {
			const inspect_info = await container.inspect();

			if (inspect_info.State.Running) {
				try {
					await container.stop({ t: 1 });
				} catch (error) {
					if (!is_nonfatal_stop_error(error)) {
						throw error;
					}
				}
			}

			await container.remove({ force: true });
		} catch (error) {
			if (is_docker_not_found_error(error)) {
				return;
			}

			throw error;
		}
	}
};
