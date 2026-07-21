import { Category } from "../types";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryListProps) {
  // Simple helper to dynamically render Lucide icons in React 19 safely
  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.LayoutGrid className={className} />;
  };

  return (
    <div className="w-full mb-6" id="shopee-categories-scroller">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <span>Categorias em Destaque</span>
          <span className="bg-orange-500 text-white text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm animate-pulse">
            Igualzinho Shopee
          </span>
        </h3>
        <span className="text-xs text-gray-400 font-semibold">
          {categories.length - 1} Categorias
        </span>
      </div>

      {/* Horizontal scrollable category list */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border text-center cursor-pointer transition-all snap-start min-w-[76px] ${
                isSelected
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"
              }`}
              id={`cat-button-${cat.id}`}
            >
              {/* Icon / Image container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-white/20"
                    : cat.id === "todos"
                      ? "bg-orange-50 text-orange-500"
                      : "bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-500"
                }`}
              >
                {renderIcon(cat.iconName, "w-6 h-6")}
              </div>

              {/* Category Label */}
              <span
                className={`text-[11px] font-bold tracking-tight max-w-[80px] line-clamp-1 truncate ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
