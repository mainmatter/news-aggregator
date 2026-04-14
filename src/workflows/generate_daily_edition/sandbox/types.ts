import type { Writable } from 'node:stream';

export type sandbox_backend_name = 'vercel' | 'docker';

export type sandbox_file = {
	path: string;
	content: string | Uint8Array;
	mode?: number;
};

export type sandbox_command_result = {
	id: string;
	exit_code: number;
	wait: () => Promise<sandbox_command_result>;
};

export type sandbox_command_handle = {
	id: string;
	wait: () => Promise<sandbox_command_result>;
};

export type sandbox_run_command_params = {
	cmd: string;
	args?: string[];
	env?: Record<string, string>;
	sudo?: boolean;
	detached?: boolean;
	stdout?: Writable;
	stderr?: Writable;
};

export type sandbox_create_config = {
	runtime: 'node24';
	timeout_ms: number;
	env: Record<string, string>;
};

export interface workflow_sandbox {
	id: string;
	writeFiles(files: sandbox_file[]): Promise<void>;
	runCommand(
		params: sandbox_run_command_params & { detached: true }
	): Promise<sandbox_command_handle>;
	runCommand(
		params: sandbox_run_command_params & { detached?: false | undefined }
	): Promise<sandbox_command_result>;
	getCommand(id: string): Promise<sandbox_command_handle>;
}

export interface sandbox_backend {
	name: sandbox_backend_name;
	create(config: sandbox_create_config): Promise<workflow_sandbox>;
	get(id: string): Promise<workflow_sandbox>;
	stop(id: string): Promise<void>;
}
