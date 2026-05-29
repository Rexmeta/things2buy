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
  lastClickedAt?: string;
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


export const createPostSlug = (title: string, fallback: string): string => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

export const getPostPath = (post: Pick<Post, 'id' | 'slug' | 'title'>): string => {
  return `/post/${post.slug || createPostSlug(post.title, post.id)}`;
};

export const getPosts = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

export const getPost = async (id: string): Promise<Post | undefined> => {
  const posts = await getPosts();
  return posts.find(p => p.slug === id || p.id === id);
};

export const savePost = async (post: Post): Promise<void> => {
  const normalizedPost = {
    ...post,
    slug: post.slug || createPostSlug(post.title, post.id)
  };

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPost),
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
  platform: Product['platform'];
  affiliateLink: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  clickedAt: string;
}

export interface ProductIndex {
  productId: string;
  postId: string;
  affiliateLink: string;
  platform: Product['platform'];
  name: string;
  price: number;
  currency: Product['currency'];
  productUrl?: string;
  imageUrl?: string;
  clickCount?: number;
  conversionScore?: number;
  lastClickedAt?: string;
  updatedAt: string;
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
