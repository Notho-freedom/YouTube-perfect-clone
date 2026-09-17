export interface ExploreSection {
  slug: string;
  label: string;
  icon: string;
  /** YouTube category id for chart=mostPopular. */
  categoryId?: string;
  /** Search query used when the category chart is unavailable. */
  query?: string;
  live?: boolean;
}

export const exploreSections: ExploreSection[] = [
{ slug: 'trending', label: 'Trending', icon: 'trending' },
{ slug: 'music', label: 'Music', icon: 'music', categoryId: '10' },
{ slug: 'live', label: 'Live', icon: 'live', live: true, query: 'live' },
{ slug: 'gaming', label: 'Gaming', icon: 'gaming', categoryId: '20' },
{ slug: 'news', label: 'News', icon: 'news', categoryId: '25' },
{ slug: 'sport', label: 'Sport', icon: 'sports', categoryId: '17' },
{ slug: 'courses', label: 'Courses', icon: 'courses', query: 'full course tutorial' },
{
  slug: 'fashion-beauty',
  label: 'Fashion & beauty',
  icon: 'fashion',
  query: 'fashion beauty routine'
},
{ slug: 'podcasts', label: 'Podcasts', icon: 'podcasts', query: 'podcast episode' }];


export function findExploreSection(slug: string): ExploreSection | undefined {
  return exploreSections.find((section) => section.slug === slug);
}