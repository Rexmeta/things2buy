import { ProductProvider } from './types';

export const aliExpressProvider: ProductProvider = {
  name: 'AliExpress',
  search: async (keyword: string) => {
    // In real app, call AliExpress Affiliate API
    // Need ALIEXPRESS_API_KEY from process.env
    console.log(`Searching AliExpress for ${keyword}`);
    return [];
  },
  getAffiliateLink: async (url: string) => {
    return url; // Placeholder for real affiliate conversion
  }
};
