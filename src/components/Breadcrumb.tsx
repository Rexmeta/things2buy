import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.link ? (
            <Link to={item.link} className="hover:text-indigo-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-900">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-2 text-slate-400" />
          )}
        </div>
      ))}
    </nav>
  );
}
