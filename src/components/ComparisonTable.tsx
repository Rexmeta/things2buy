import { Product } from '../data/posts';
import { ExternalLink, Check, X } from 'lucide-react';

interface ComparisonTableProps {
  products: Product[];
  postId?: string;
}

export function ComparisonTable({ products, postId }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto my-12 rounded-2xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
          <tr>
            <th className="px-6 py-4">Product</th>
            <th className="px-6 py-4">Best For</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4">Pros</th>
            <th className="px-6 py-4">Cons</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
              <td className="px-6 py-4 text-slate-600">{product.bestFor}</td>
              <td className="px-6 py-4 font-bold text-indigo-600">{product.currency === 'KRW' ? '₩' : '$'}{product.price.toLocaleString()}</td>
              <td className="px-6 py-4">
                <ul className="list-none space-y-1">
                  {product.pros.slice(0, 2).map((p, i) => (
                    <li key={i} className="flex items-center gap-1 text-green-700 text-xs"><Check className="h-3 w-3" /> {p}</li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4">
                <ul className="list-none space-y-1">
                  {product.cons.slice(0, 2).map((c, i) => (
                    <li key={i} className="flex items-center gap-1 text-red-700 text-xs"><X className="h-3 w-3" /> {c}</li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4">
                <a href={`/go/${product.id}${postId ? `?postId=${encodeURIComponent(postId)}` : ''}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                  Buy <ExternalLink className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
