import { env } from '$env/dynamic/private';
import { APIError, Sandbox } from '@vercel/sandbox';
import type { Command, CommandFinished } from '@vercel/sandbox';
import type {
	sandbox_backend,
	sandbox_command_handle,
	sandbox_command_result,
	sandbox_create_config,
	sandbox_file,
	sandbox_run_command_params,
	workflow_sandbox
} from './types';

function to_buffer(content: sandbox_file['content']) {
	return Buffer.from(content);
}

function wrap_command_result(command: CommandFinished): sandbox_command_result {
	return {
		id: command.cmdId,
		exit_code: command.exitCode,
		wait: async () => wrap_command_result(await command.wait())
	};
}

function wrap_command_handle(command: Command): sandbox_command_handle {
	return {
		id: command.cmdId,
		wait: async () => wrap_command_result(await command.wait())
	};
}

function wrap_sandbox(sandbox: Sandbox): workflow_sandbox {
	async function runCommand(
		params: sandbox_run_command_params & { detached: true }
	): Promise<sandbox_command_handle>;
	async function runCommand(
		params: sandbox_run_command_params & { detached?: false | undefined }
	): Promise<sandbox_command_result>;
	async function runCommand(params: sandbox_run_command_params) {
		if (params.detached) {
			const command = await sandbox.runCommand({
				cmd: params.cmd,
				args: params.args,
				env: params.env,
				sudo: params.sudo,
				detached: true,
				stdout: params.stdout,
				stderr: params.stderr
			});

			return wrap_command_handle(command);
		}

		const command = await sandbox.runCommand({
			cmd: params.cmd,
			args: params.args,
			env: params.env,
			sudo: params.sudo,
			stdout: params.stdout,
			stderr: params.stderr
		});

		return wrap_command_result(command);
	}

	return {
		id: sandbox.sandboxId,
		async writeFiles(files) {
			await sandbox.writeFiles(
				files.map((file) => ({
					path: file.path,
					content: to_buffer(file.content),
					...(file.mode ? { mode: file.mode } : {})
				}))
			);
		},
		runCommand,
		async getCommand(id) {
			return wrap_command_handle(await sandbox.getCommand(id));
		}
	};
}

function is_missing_sandbox_error(error: unknown) {
	return error instanceof APIError && error.response.status === 404;
}

async function create_vercel_sandbox(config: sandbox_create_config) {
	return Sandbox.create({
		runtime: config.runtime,
		timeout: config.timeout_ms,
		env: config.env,
		...(env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID
			? {
					token: env.VERCEL_TOKEN,
					projectId: env.VERCEL_PROJECT_ID,
					teamId: env.VERCEL_TEAM_ID
				}
			: {})
	});
}

export const vercel_sandbox_backend: sandbox_backend = {
	name: 'vercel',
	async create(config) {
		return wrap_sandbox(await create_vercel_sandbox(config));
	},
	async get(id) {
		return wrap_sandbox(
			await Sandbox.get({
				sandboxId: id
			})
		);
	},
	async stop(id) {
		try {
			const sandbox = await Sandbox.get({ sandboxId: id });
			await sandbox.stop({ blocking: true });
		} catch (error) {
			if (is_missing_sandbox_error(error)) {
				return;
			}

			throw error;
		}
	}
};
