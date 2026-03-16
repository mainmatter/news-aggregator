import * as v from 'valibot';

export const canonical_article_schema = v.object({
	id: v.string(),
	canonical_url: v.string(),
	title: v.nullable(v.string()),
	summary: v.nullable(v.string()),
	category: v.nullable(v.string()),
	published_at: v.nullable(v.string()),
	content_hash: v.nullable(v.string()),
	summarized_at: v.nullable(v.string())
});

export const edition_article_schema = v.object({
	id: v.string(),
	article_id: v.string(),
	canonical_url: v.string(),
	url: v.string(),
	title: v.string(),
	source: v.string(),
	published_at: v.string(),
	summary: v.string(),
	category: v.string(),
	position: v.number(),
	section: v.nullable(v.string()),
	reason: v.nullable(v.string()),
	custom_title: v.nullable(v.string()),
	custom_summary: v.nullable(v.string()),
	custom_category: v.nullable(v.string())
});

export const article_schema = edition_article_schema;

export type CanonicalArticle = v.InferOutput<typeof canonical_article_schema>;
export type EditionArticle = v.InferOutput<typeof edition_article_schema>;
export type Article = EditionArticle;
