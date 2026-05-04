const redacted_value = '[REDACTED]';
const sensitive_key_pattern =
	/(authorization|cookie|set-cookie|api[-_]?key|token|secret|password|session)/i;

function sanitize_unknown(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => sanitize_unknown(item));
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	const sanitized: Record<string, unknown> = {};

	for (const [key, nested_value] of Object.entries(value)) {
		if (sensitive_key_pattern.test(key)) {
			sanitized[key] = redacted_value;
			continue;
		}

		sanitized[key] = sanitize_unknown(nested_value);
	}

	return sanitized;
}

export function sanitize_sentry_event<T>(event: T): T {
	return sanitize_unknown(event) as T;
}

export function sanitize_sentry_breadcrumb<T>(breadcrumb: T): T {
	return sanitize_unknown(breadcrumb) as T;
}
