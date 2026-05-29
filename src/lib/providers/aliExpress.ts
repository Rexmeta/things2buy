import { createHash } from 'node:crypto';
import { ProductProvider } from './types';

const API_URL = process.env.ALIEXPRESS_API_URL || 'https://api-sg.aliexpress.com/sync';
const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID;
const DEFAULT_CURRENCY = process.env.ALIEXPRESS_TARGET_CURRENCY || 'USD';
const DEFAULT_LANGUAGE = process.env.ALIEXPRESS_TARGET_LANGUAGE || 'EN';
const PAGE_SIZE = process.env.ALIEXPRESS_PAGE_SIZE || '10';

type AliExpressProduct = Record<string, any>;

const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const signParams = (params: Record<string, string>) => {
  const payload = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');

  return createHash('md5')
    .update(`${APP_SECRET}${payload}${APP_SECRET}`)
    .digest('hex')
    .toUpperCase();
};

const callAliExpress = async (method: string, params: Record<string, string>) => {
  if (!APP_KEY || !APP_SECRET) {
    console.warn('AliExpress API credentials are not configured. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET.');
    return null;
  }

  const signedParams = Object.fromEntries(
    Object.entries({
      app_key: APP_KEY,
      format: 'json',
      method,
      sign_method: 'md5',
      timestamp: timestamp(),
      v: '2.0',
      ...params
    }).filter(([, value]) => value !== undefined && value !== '')
  ) as Record<string, string>;

  const body = new URLSearchParams({
    ...signedParams,
    sign: signParams(signedParams)
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`AliExpress API request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error_response) {
    throw new Error(json.error_response.msg || json.error_response.message || 'AliExpress API returned an error');
  }

  return json;
};

const asArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const parseNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value !== 'string') return fallback;

  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractProducts = (payload: any): AliExpressProduct[] => {
  const result =
    payload?.aliexpress_affiliate_product_query_response?.resp_result?.result ||
    payload?.resp_result?.result ||
    payload?.result ||
    payload;

  return asArray(result?.products?.product || result?.products || result?.product || result?.items?.item || result?.items);
};

const extractPromotionLink = (payload: any) => {
  const result =
    payload?.aliexpress_affiliate_link_generate_response?.resp_result?.result ||
    payload?.resp_result?.result ||
    payload?.result ||
    payload;

  const links = asArray(result?.promotion_links?.promotion_link || result?.promotion_links || result?.links?.link || result?.links);
  return links[0]?.promotion_link || links[0]?.link || links[0]?.url;
};

const normalizeProduct = async (product: AliExpressProduct) => {
  const productId = String(product.product_id || product.item_id || product.id || '');
  const productUrl = product.product_detail_url || product.detail_url || product.product_url || product.url || '';
  const affiliateLink = product.promotion_link || product.affiliate_link || await aliExpressProvider.getAffiliateLink(productUrl);
  const price = parseNumber(product.target_sale_price || product.sale_price || product.app_sale_price || product.price);
  const originalPrice = parseNumber(product.target_original_price || product.original_price, 0);
  const evaluateRate = parseNumber(product.evaluate_rate, 0);

  return {
    id: productId || `aliexpress-${encodeURIComponent(productUrl)}`,
    name: product.product_title || product.title || product.name || 'AliExpress product',
    brand: product.brand_name || product.shop_name,
    platform: 'AliExpress',
    price,
    currency: product.target_sale_price_currency || product.currency || DEFAULT_CURRENCY,
    originalPrice: originalPrice || undefined,
    discountRate: parseNumber(product.discount, 0) || undefined,
    rating: evaluateRate ? Math.min(5, Math.max(0, evaluateRate / 20)) : parseNumber(product.rating, 0),
    reviewCount: parseNumber(product.review_count || product.orders || product.lastest_volume, 0),
    imageUrl: product.product_main_image_url || product.image_url || product.image || '',
    affiliateLink: affiliateLink || productUrl,
    productUrl,
    bestFor: product.first_level_category_name || product.second_level_category_name || '',
    avoidIf: '',
    pros: [],
    cons: [],
    whyRecommended: product.product_title || product.title || '',
    selectionCriteria: product.second_level_category_name || product.first_level_category_name || '',
    rationale: product.product_title || product.title || '',
    risks: '',
    koreanUserCaveats: '',
    reliabilityGrade: 'Medium',
    shippingInfo: product.ship_to_days ? `${product.ship_to_days} days` : undefined,
    lastCheckedAt: new Date().toISOString(),
    conversionScore: 0,
    clickCount: 0
  };
};

export const aliExpressProvider: ProductProvider = {
  name: 'AliExpress',
  search: async (keyword: string) => {
    const payload = await callAliExpress('aliexpress.affiliate.product.query', {
      keywords: keyword,
      page_no: '1',
      page_size: PAGE_SIZE,
      target_currency: DEFAULT_CURRENCY,
      target_language: DEFAULT_LANGUAGE,
      tracking_id: TRACKING_ID || ''
    });

    if (!payload) return [];

    const products = extractProducts(payload);
    return Promise.all(products.map(normalizeProduct));
  },
  getAffiliateLink: async (url: string) => {
    if (!url || !TRACKING_ID) return url;

    const payload = await callAliExpress('aliexpress.affiliate.link.generate', {
      promotion_link_type: '0',
      source_values: url,
      tracking_id: TRACKING_ID
    });

    return extractPromotionLink(payload) || url;
  }
};
