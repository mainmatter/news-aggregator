import { Sandbox } from '@vercel/sandbox';

export async function stop_sandbox({
	sandbox_id,
	command_id
}: {
	sandbox_id: string;
	command_id: string;
}) {
	'use step';

	const sandbox = await Sandbox.get({
		sandboxId: sandbox_id
	});

	try {
		const command = await sandbox.getCommand(command_id);
		await command.wait();
	} catch (error) {
		console.error(`[sandbox:${sandbox_id}] Failed to retrieve command logs:`, error);
	}

	await sandbox.stop({ blocking: true });
}
