import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category, StockItem } from "../types";
import { SubcategoryCard } from "./SubcategoryCard";

interface Props {
  id: string;
  category: Category;
  label: string;
  items: StockItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleUsed: (item: StockItem, used: boolean) => void;
  onDelete: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDuplicate: (item: StockItem) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (item: StockItem) => void;
  draggable: boolean;
}

export function SortableSubcategoryCard({ id, draggable, ...rest }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-90" : ""}>
      <SubcategoryCard
        {...rest}
        dragHandle={
          draggable ? (
            <button
              {...attributes}
              {...listeners}
              aria-label="拖曳排序"
              className="shrink-0 cursor-grab touch-none rounded-lg px-1.5 py-2 text-gray-300 active:cursor-grabbing"
            >
              ⠿
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
