import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Things2buy</h3>
            <p className="text-sm text-slate-600">
              Curated recommendations for the best products to buy for every occasion.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/category/Travel" className="hover:text-indigo-600">Travel Essentials</Link></li>
              <li><Link to="/category/Event" className="hover:text-indigo-600">Events & Holidays</Link></li>
              <li><Link to="/category/Anniversary" className="hover:text-indigo-600">Anniversary Gifts</Link></li>
              <li><Link to="/category/Tech" className="hover:text-indigo-600">Tech Gadgets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="#" className="hover:text-indigo-600">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-indigo-600">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-indigo-600">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Affiliate Disclosure</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Things2buy is a participant in the AliExpress Affiliate Program. We may earn a commission on qualifying purchases made through our links at no extra cost to you.
            </p>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8 text-center text-sm text-slate-500">
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()} Things2buy. Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
