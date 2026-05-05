import {
	generation_failure_codes,
	report_generation_exception
} from '$lib/server/observability/sentry';
import { get_sandbox_backend } from '../sandbox/backend';

export async function stop_sandbox({
	sandbox_id,
	command_id,
	edition_id,
	edition_date,
	source_id,
	correlation_id
}: {
	sandbox_id: string;
	command_id: string;
	edition_id?: string;
	edition_date?: string;
	source_id?: string;
	correlation_id?: string;
}) {
	'use step';

	const backend = get_sandbox_backend();

	try {
		const sandbox = await backend.get(sandbox_id);

		try {
			const command = await sandbox.getCommand(command_id);
			await command.wait();
		} catch (error) {
			report_generation_exception({
				error,
				tags: {
					error_code: generation_failure_codes.sandbox_stop_wait_failed,
					stage: 'stop_sandbox_wait_command',
					sandbox_id,
					...(edition_id ? { edition_id } : {}),
					...(edition_date ? { edition_date } : {}),
					...(source_id ? { source_id } : {}),
					...(correlation_id ? { correlation_id } : {})
				}
			});

			console.error(`[sandbox:${sandbox_id}] Failed to retrieve command logs:`, error);
		}
	} catch (error) {
		report_generation_exception({
			error,
			tags: {
				error_code: generation_failure_codes.sandbox_stop_get_failed,
				stage: 'stop_sandbox_get',
				sandbox_id,
				...(edition_id ? { edition_id } : {}),
				...(edition_date ? { edition_date } : {}),
				...(source_id ? { source_id } : {}),
				...(correlation_id ? { correlation_id } : {})
			}
		});

		console.error(`[sandbox:${sandbox_id}] Failed to retrieve sandbox during cleanup:`, error);
	} finally {
		try {
			await backend.stop(sandbox_id);
		} catch (error) {
			report_generation_exception({
				error,
				tags: {
					error_code: generation_failure_codes.sandbox_stop_failed,
					stage: 'stop_sandbox_stop',
					sandbox_id,
					...(edition_id ? { edition_id } : {}),
					...(edition_date ? { edition_date } : {}),
					...(source_id ? { source_id } : {}),
					...(correlation_id ? { correlation_id } : {})
				}
			});

			// eslint-disable-next-line no-unsafe-finally
			throw error;
		}
	}
}
