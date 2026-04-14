import { get_sandbox_backend } from '../sandbox/backend';

export async function stop_sandbox({
	sandbox_id,
	command_id
}: {
	sandbox_id: string;
	command_id: string;
}) {
	'use step';

	const backend = get_sandbox_backend();

	try {
		const sandbox = await backend.get(sandbox_id);

		try {
			const command = await sandbox.getCommand(command_id);
			await command.wait();
		} catch (error) {
			console.error(`[sandbox:${sandbox_id}] Failed to retrieve command logs:`, error);
		}
	} catch (error) {
		console.error(`[sandbox:${sandbox_id}] Failed to retrieve sandbox during cleanup:`, error);
	} finally {
		await backend.stop(sandbox_id);
	}
}
