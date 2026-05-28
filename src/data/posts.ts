export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  currency: 'USD' | 'KRW';
  originalPrice?: number;
  discountRate?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  affiliateLink: string;
  description: string;

  bestFor: string;
  pros: string[];
  cons: string[];
  whyRecommended: string;
  avoidIf: string;
  sourcePlatform: 'AliExpress' | 'Coupang' | 'Naver' | 'Amazon';
  shippingInfo?: string;
  lastCheckedAt: string;
  clickCount?: number;
  conversionScore?: number;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  coverImage: string;
  category: 'Travel' | 'Event' | 'Anniversary' | 'Tech' | 'Home';
  tags: string[];
  date: string;
  author: string;
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
