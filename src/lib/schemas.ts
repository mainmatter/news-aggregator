import * as v from 'valibot';

export const article_schema = v.object({
	id: v.number(),
	title: v.string(),
	source: v.string(),
	published_at: v.string(),
	summary: v.string(),
	url: v.string(),
	category: v.string()
});

export type Article = v.InferOutput<typeof article_schema>;
