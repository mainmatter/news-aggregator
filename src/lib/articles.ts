export const articles = [
	{
		id: 1,
		title: 'SpaceX Successfully Lands Starship for the First Time',
		source: 'TechCrunch',
		published_at: '2 hours ago',
		summary:
			"SpaceX achieved a historic milestone today as its Starship rocket completed a full orbital flight and landed successfully. The achievement marks a major step toward the company's Mars ambitions.",
		url: 'https://example.com/spacex-starship',
		category: 'Technology'
	},
	{
		id: 2,
		title: 'Global Climate Summit Reaches Landmark Agreement',
		source: 'Reuters',
		published_at: '4 hours ago',
		summary:
			'World leaders at the 2026 Global Climate Summit have agreed to ambitious new emissions targets, pledging a 60% reduction by 2035. The deal includes binding commitments from all major economies.',
		url: 'https://example.com/climate-summit',
		category: 'World'
	},
	{
		id: 3,
		title: "Breakthrough in Alzheimer's Treatment Shows Promise",
		source: 'Nature',
		published_at: '6 hours ago',
		summary:
			"A new drug trial has shown a 35% reduction in cognitive decline among early-stage Alzheimer's patients. Researchers say it could be the most significant advance in treatment in decades.",
		url: 'https://example.com/alzheimers-treatment',
		category: 'Science'
	},
	{
		id: 4,
		title: 'Stock Markets Rally After Fed Signals Rate Cuts',
		source: 'Bloomberg',
		published_at: '8 hours ago',
		summary:
			'Major indices surged after the Federal Reserve indicated it would begin cutting interest rates in the coming months. The S&P 500 closed at a new all-time high.',
		url: 'https://example.com/fed-rate-cuts',
		category: 'Business'
	},
	{
		id: 5,
		title: 'New JavaScript Framework Claims 10x Performance Gains',
		source: 'Hacker News',
		published_at: '10 hours ago',
		summary:
			'An open-source project is generating buzz with benchmarks showing dramatic performance improvements over existing frameworks. Skeptics urge caution until independent testing confirms the claims.',
		url: 'https://example.com/js-framework',
		category: 'Technology'
	},
	{
		id: 6,
		title: 'UNESCO Adds New Sites to World Heritage List',
		source: 'BBC News',
		published_at: '12 hours ago',
		summary:
			'Five new cultural and natural sites have been added to the UNESCO World Heritage List, including ancient ruins in Peru and a vast mangrove ecosystem in Southeast Asia.',
		url: 'https://example.com/unesco-heritage',
		category: 'Culture'
	}
];

export const today = new Date().toLocaleDateString('en-US', {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric'
});
