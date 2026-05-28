export interface ProductProvider {
  name: string;
  search: (keyword: string) => Promise<any[]>;
  getAffiliateLink: (originalUrl: string) => Promise<string>;
}
