import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const TablePaginationControls: React.FC<TablePaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  className,
}) => {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between', className)}>
      <p className="text-sm text-muted-foreground">
        Affichage de {startItem} à {endItem} sur {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm text-muted-foreground px-2">
          Page {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
