import { Product } from '../data/posts';
import { Star, ExternalLink, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  postId?: string;
}

export function ProductCard({ product, postId }: ProductCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
      <div className="aspect-square overflow-hidden bg-slate-50 p-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="mb-2 font-semibold text-slate-900 line-clamp-2" title={product.name}>
          {product.name}
        </h4>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center text-yellow-400">
            <Star className="h-4 w-4 fill-current" />
            <span className="ml-1 text-sm font-medium text-slate-700">{product.rating}</span>
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount} reviews)</span>
        </div>
        <p className="mb-4 text-xs text-slate-500 line-clamp-2">
          {product.whyRecommended || product.rationale}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {product.currency === 'KRW' ? '₩' : '$'}{product.price.toLocaleString()}
          </span>
          <a
            href={`/go/${product.id}${postId ? `?postId=${encodeURIComponent(postId)}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Now
          </a>
        </div>
      </div>
    </div>
  );
}
