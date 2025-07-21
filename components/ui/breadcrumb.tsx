import React from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            onClick={() => onNavigate(item.id)}
            className="hover:text-blue-600 transition-colors"
          >
            {item.name}
          </button>
          {index < items.length - 1 && <ChevronRight className="h-4 w-4" />}
        </React.Fragment>
      ))}
    </nav>
  );
}
