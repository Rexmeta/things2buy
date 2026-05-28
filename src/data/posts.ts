export interface Product {
  id: string;
  postId: string;
  name: string;
  brand?: string;
  platform: 'AliExpress' | 'Coupang' | 'Naver' | 'Amazon';
  price: number;
  currency: 'USD' | 'KRW';
  originalPrice?: number;
  discountRate?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  affiliateLink: string;
  productUrl: string;
  
  // Decision Engine Fields
  bestFor: string;
  avoidIf: string;
  pros: string[];
  cons: string[];
  whyRecommended: string;
  selectionCriteria: string;
  rationale: string;
  risks: string;
  koreanUserCaveats: string;
  reliabilityGrade: 'High' | 'Medium' | 'Low';
  
  shippingInfo?: string;
  lastCheckedAt: string;
  clickCount?: number;
  conversionScore?: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  quickAnswer: string;
  category: 'Travel' | 'Event' | 'Anniversary' | 'Tech' | 'Home';
  tags: string[];
  
  // SEO/AEO Fields
  targetKeywords: string[];
  searchIntent: string;
  targetPersona: string;
  
  status: 'draft' | 'published';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  coverImage: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  
  products: Product[];
}

export const getPosts = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

export const getPost = async (id: string): Promise<Post | undefined> => {
  const posts = await getPosts();
  return posts.find(p => p.id === id);
};

export const savePost = async (post: Post): Promise<void> => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error('Failed to save post');
};
export const deletePost = async (id: string): Promise<void> => {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': 'admin123' },
  });
  if (!response.ok) throw new Error('Failed to delete post');
};

export interface Click {
  id: string;
  postId: string;
  productId: string;
  source: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  clickedAt: string;
}

export interface KeywordOpportunity {
  id: string;
  keyword: string;
  intent: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTraffic: number;
  monetizationScore: number;
  trendScore: number;
  source: string;
  createdAt: string;
}
