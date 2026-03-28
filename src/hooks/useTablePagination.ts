import { useEffect, useMemo, useState } from 'react';

interface UseTablePaginationOptions {
  itemsPerPage?: number;
}

interface UseTablePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
}

export const DEFAULT_TABLE_ITEMS_PER_PAGE = 10;

export function useTablePagination<T>(
  data: T[],
  options: UseTablePaginationOptions = {}
): UseTablePaginationResult<T> {
  const { itemsPerPage = DEFAULT_TABLE_ITEMS_PER_PAGE } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;

  const paginatedData = useMemo(
    () => data.slice(startIndex, startIndex + itemsPerPage),
    [data, startIndex, itemsPerPage]
  );

  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage: (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
  };
}
