import { Sandbox } from '@vercel/sandbox';

export async function stop_sandbox({ sandbox_id }: { sandbox_id: string }) {
	'use step';

	const sandbox = await Sandbox.get({
		sandboxId: sandbox_id
	});
	await sandbox.stop({ blocking: true });
}
