import { query } from '$app/server';

export type DailyEditionSummary = {
	id: string;
	edition_date: string;
	status: string;
	title: string | null;
	summary: string | null;
	article_count: number;
};

function days_ago(n: number) {
	return new Date(Date.now() - 86400000 * n).toISOString().slice(0, 10);
}

// TODO: replace with real DB query
const mock_editions: DailyEditionSummary[] = [
	{
		id: 'edition-1',
		edition_date: days_ago(0),
		status: 'published',
		title: 'Today\u2019s Top Stories',
		summary: 'SpaceX lands Starship, climate summit breakthrough, and more.',
		article_count: 6
	},
	{
		id: 'edition-2',
		edition_date: days_ago(1),
		status: 'published',
		title: 'Yesterday\u2019s Highlights',
		summary: 'AI regulation debate, quantum computing milestone, market shifts.',
		article_count: 5
	},
	{
		id: 'edition-3',
		edition_date: days_ago(2),
		status: 'published',
		title: 'Weekend Roundup',
		summary: 'Open source funding, privacy laws update, ocean exploration.',
		article_count: 4
	},
	{
		id: 'edition-4',
		edition_date: days_ago(3),
		status: 'published',
		title: 'Midweek Digest',
		summary: 'Infrastructure bill, biotech advances, cultural events.',
		article_count: 7
	},
	{
		id: 'edition-5',
		edition_date: days_ago(4),
		status: 'published',
		title: 'Global Outlook',
		summary: 'Trade negotiations, vaccine rollout, space debris concerns.',
		article_count: 5
	},
	{
		id: 'edition-6',
		edition_date: days_ago(5),
		status: 'published',
		title: 'Tech & Science',
		summary: 'Fusion energy update, social media regulation, Mars rover data.',
		article_count: 6
	},
	{
		id: 'edition-7',
		edition_date: days_ago(6),
		status: 'published',
		title: 'Early Week Edition',
		summary: 'Elections, renewable energy report, tech earnings.',
		article_count: 5
	},
	{
		id: 'edition-8',
		edition_date: days_ago(8),
		status: 'published',
		title: 'Last Week Recap',
		summary: 'Housing market, AI art controversy, ocean temperatures.',
		article_count: 4
	},
	{
		id: 'edition-9',
		edition_date: days_ago(10),
		status: 'published',
		title: 'Policy & Markets',
		summary: 'Central bank decisions, immigration reform, startup funding.',
		article_count: 6
	},
	{
		id: 'edition-10',
		edition_date: days_ago(12),
		status: 'published',
		title: 'Science Frontiers',
		summary: 'CRISPR breakthroughs, deep sea discovery, asteroid tracking.',
		article_count: 5
	},
	{
		id: 'edition-11',
		edition_date: days_ago(14),
		status: 'published',
		title: 'World Affairs',
		summary: 'UN summit, cybersecurity threats, cultural preservation.',
		article_count: 7
	},
	{
		id: 'edition-12',
		edition_date: days_ago(17),
		status: 'published',
		title: 'Innovation Report',
		summary: 'Quantum computing, electric aviation, urban farming.',
		article_count: 4
	}
];

export const get_daily_editions = query(async () => {
	// TODO: replace with real DB query
	return mock_editions;
});
