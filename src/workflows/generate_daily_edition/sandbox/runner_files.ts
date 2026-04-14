import runner_source from './runner.js?raw';
import type { sandbox_file } from './types';

export function get_runner_files(): sandbox_file[] {
	return [
		{
			path: 'package.json',
			content: JSON.stringify(
				{
					name: 'source-extractor',
					version: '1.0.0',
					type: 'module'
				},
				null,
				2
			)
		},
		{
			path: 'runner.js',
			content: runner_source
		}
	];
}
