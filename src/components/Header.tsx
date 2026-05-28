import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          <span>Things2buy</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <Link to="/category/Travel" className="hover:text-indigo-600 transition-colors">Travel</Link>
          <Link to="/category/Event" className="hover:text-indigo-600 transition-colors">Events</Link>
          <Link to="/category/Anniversary" className="hover:text-indigo-600 transition-colors">Anniversary</Link>
          <Link to="/category/Tech" className="hover:text-indigo-600 transition-colors">Tech</Link>
        </nav>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </form>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/admin" 
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <User className="h-4 w-4" /> Admin
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
