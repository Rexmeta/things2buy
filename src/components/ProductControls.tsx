import { useState } from 'react';
import { Product } from '../data/posts';
import { ArrowUpDown } from 'lucide-react';

interface ProductControlsProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
}

export function ProductControls({ products, onFilter }: ProductControlsProps) {
  const [activeSort, setActiveSort] = useState('');

  const handleSort = (type: string) => {
    setActiveSort(type);
    let sorted = [...products];
    switch (type) {
      case 'price': 
        sorted.sort((a, b) => a.price - b.price); 
        break;
      case 'rating': 
        sorted.sort((a, b) => b.rating - a.rating); 
        break;
      case 'best': 
        sorted.sort((a, b) => (b.conversionScore || 0) - (a.conversionScore || 0)); 
        break;
      default:
        sorted = [...products];
    }
    onFilter(sorted);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4" /> Sort By:
      </span>
      <button 
        onClick={() => handleSort('best')}
        className={`px-4 py-2 rounded-full text-sm ${activeSort === 'best' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
      >
        Best Overall
      </button>
      <button 
        onClick={() => handleSort('price')}
        className={`px-4 py-2 rounded-full text-sm ${activeSort === 'price' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
      >
        Price (Low to High)
      </button>
      <button 
        onClick={() => handleSort('rating')}
        className={`px-4 py-2 rounded-full text-sm ${activeSort === 'rating' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
      >
        Review Score
      </button>
    </div>
  );
}
