import * as v from 'valibot';

export const edition_generation_input_schema = v.object({
	user_id: v.pipe(v.string(), v.nonEmpty()),
	edition_date: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
	replace_existing: v.optional(v.boolean(), false),
	tunnel_base_url: v.optional(v.string())
});

export const source_article_result_schema = v.object({
	url: v.pipe(v.string(), v.nonEmpty()),
	canonical_url: v.optional(v.pipe(v.string(), v.nonEmpty())),
	title: v.optional(v.string()),
	summary: v.optional(v.string()),
	category: v.optional(v.string()),
	published_at: v.optional(v.nullable(v.string())),
	section: v.optional(v.nullable(v.string())),
	reason: v.optional(v.nullable(v.string()))
});

export const source_callback_payload_schema = v.object({
	source_id: v.pipe(v.string(), v.nonEmpty()),
	source_name: v.pipe(v.string(), v.nonEmpty()),
	source_url: v.pipe(v.string(), v.nonEmpty()),
	status: v.picklist(['success', 'error']),
	articles: v.optional(v.array(source_article_result_schema), []),
	error: v.optional(v.string()),
	generated_at: v.optional(v.string())
});

export type PreparationGenerationInput = v.InferOutput<typeof edition_generation_input_schema>;
export type EditionGenerationInput = v.InferOutput<typeof edition_generation_input_schema> & {
	preparation: PreparedGenerationState;
};
export type SourceArticleResult = v.InferOutput<typeof source_article_result_schema>;
export type SourceGenerationResult = v.InferOutput<typeof source_callback_payload_schema>;

export type WorkflowUserSource = {
	source_id: string;
	display_name: string;
	canonical_url: string;
	label: string | null;
};

export type PreparedGenerationState = {
	edition_id: string;
	edition_date: string;
	had_existing_edition: boolean;
	previous_status: string | null;
	previous_title: string | null;
	previous_summary: string | null;
	previous_generated_at: Date | null;
	previous_article_count: number;
	replace_existing: boolean;
};

export type PersistEditionResult = {
	edition_id: string;
	status: 'published' | 'failed' | 'restored';
	successful_sources: number;
	failed_sources: number;
	published_articles: number;
};
