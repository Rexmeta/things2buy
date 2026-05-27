import { GoogleGenAI } from "@google/genai";
import { Product, Post } from "../data/posts";

// Initialize Gemini API
// Note: In a real app, this should be backend-only to protect the key.
// Since this is a client-side demo, we use the env var directly.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are an expert shopping editor for a blog called "Things2buy".
    Create a detailed shopping guide about "${topic}".
    
    Return a JSON object with the following structure:
    {
      "title": "Catchy, SEO-friendly title",
      "excerpt": "Engaging 2-sentence summary",
      "content": "Full article content in Markdown format. Include H2 and H3 headers. Do NOT include product list in the markdown, just the intro, advice, and conclusion.",
      "category": "One of: Travel, Event, Anniversary, Tech, Home",
      "tags": ["Array", "of", "5", "tags"],
      "coverImageQuery": "A search query to find a relevant cover image on Unsplash",
      "products": [
        {
          "name": "Specific product name 1",
          "description": "Why this product is good (1 sentence)",
          "searchKeyword": "Search query to find this exact item on AliExpress"
        },
        {
          "name": "Specific product name 2",
          "description": "Why this product is good (1 sentence)",
          "searchKeyword": "Search query to find this exact item on AliExpress"
        },
        {
          "name": "Specific product name 3",
          "description": "Why this product is good (1 sentence)",
          "searchKeyword": "Search query to find this exact item on AliExpress"
        }
      ]
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText) as GeneratedContent;
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
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
