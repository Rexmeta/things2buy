import { cn } from '../lib/utils';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ categories, activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('All')}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-all",
          activeCategory === 'All'
            ? "bg-slate-900 text-white shadow-md"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            activeCategory === category
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
