import { Product } from "../data/posts";

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  category: 'Travel' | 'Event' | 'Anniversary' | 'Tech' | 'Home';
  tags: string[];
  coverImageQuery: string;
  products: {
    name: string;
    description: string;
    searchKeyword: string; // Keyword to find this product on AliExpress
  }[];
}

export async function generatePostContent(topic: string): Promise<GeneratedContent> {
  const response = await fetch('/api/generate-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': 'admin123' // Temporary password as hardcoded in server.ts
    },
    body: JSON.stringify({ topic })
  });

  if (!response.ok) {
    throw new Error('Failed to generate content: ' + response.statusText);
  }

  return response.json();
}

// Mock function to simulate AliExpress API search
// In a real implementation, this would call your backend which calls AliExpress API
export async function searchAliExpressProducts(products: GeneratedContent['products'], trackingId: string): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return products.map((p, index) => ({
    id: `auto-${Date.now()}-${index}`,
    name: p.name,
    price: `$${(Math.random() * 50 + 10).toFixed(2)}`, // Mock price
    rating: Number((Math.random() * 1 + 4).toFixed(1)), // Mock rating 4.0-5.0
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    // Use placeholder images from Unsplash as we can't get real AliExpress images without API
    imageUrl: `https://source.unsplash.com/random/400x400/?${encodeURIComponent(p.searchKeyword)}`, 
    // Mock affiliate link format
    affiliateLink: `https://s.click.aliexpress.com/e/_mockLink${index}?trackingId=${trackingId}`,
    description: p.description
  }));
}
