function parse_edition_date(date: string | null | undefined) {
	if (!date) {
		return new Date();
	}

	const [year, month, day] = date.split('-').map(Number);

	if (!year || !month || !day) {
		return new Date(date);
	}

	return new Date(year, month - 1, day);
}

export function format_edition_date(date: string | null | undefined) {
	const parsed_date = parse_edition_date(date);

	return {
		long: parsed_date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		short: parsed_date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	};
}
