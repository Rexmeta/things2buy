import { Product } from "../data/posts";

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  category: 'Travel' | 'Event' | 'Anniversary' | 'Tech' | 'Home';
  tags: string[];
  coverImageQuery: string;
  quickAnswer: string;
  targetKeywords: string[];
  searchIntent: string;
  targetPersona: string;
  seoTitle: string;
  metaDescription: string;
  products: {
    name: string;
    selectionCriteria: string;
    rationale: string;
    risks: string;
    koreanUserCaveats: string;
    reliabilityGrade: 'High' | 'Medium' | 'Low';
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

export async function searchAliExpressProducts(products: GeneratedContent['products'], trackingId: string): Promise<Product[]> {
  const results = await Promise.all(products.map(async (p, index) => {
    const response = await fetch(`/api/products/search?platform=AliExpress&keyword=${encodeURIComponent(p.searchKeyword)}`, {
      headers: {
        'x-admin-password': 'admin123'
      }
    });
    const found = response.ok ? await response.json() : [];
    const best = found[0] || {};

    return {
      id: best.id || `auto-${Date.now()}-${index}`,
      postId: '',
      name: best.name || p.name,
      platform: 'AliExpress' as const,
      price: Number(best.price) || Number((Math.random() * 50 + 10).toFixed(2)),
      currency: 'USD' as const,
      rating: Number(best.rating) || Number((Math.random() * 1 + 4).toFixed(1)),
      reviewCount: Number(best.reviewCount) || Math.floor(Math.random() * 1000) + 50,
      imageUrl: best.imageUrl || `https://source.unsplash.com/random/400x400/?${encodeURIComponent(p.searchKeyword)}`,
      affiliateLink: best.affiliateLink || `https://s.click.aliexpress.com/e/_mockLink${index}?trackingId=${trackingId}`,
      productUrl: best.productUrl || best.affiliateLink || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(p.searchKeyword)}`,
      bestFor: best.bestFor || p.selectionCriteria,
      avoidIf: best.avoidIf || p.risks,
      pros: best.pros || [],
      cons: best.cons || [],
      whyRecommended: best.whyRecommended || p.rationale,
      selectionCriteria: p.selectionCriteria,
      rationale: p.rationale,
      risks: p.risks,
      koreanUserCaveats: p.koreanUserCaveats,
      reliabilityGrade: p.reliabilityGrade,
      lastCheckedAt: new Date().toISOString()
    };
  }));

  return results;
}
