import React from 'react';
import { useTablePagination } from '@/hooks/useTablePagination';
import { TablePaginationControls } from '@/components/Common/TablePaginationControls';

/**
 * Composant responsive pour les dashboards
 * Adapte le layout en fonction de la taille de l'écran
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export const ResponsiveStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    amber: 'bg-amber-500 text-amber-100',
    purple: 'bg-purple-500 text-purple-100',
    red: 'bg-red-500 text-red-100',
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === 'up' ? (
                <span className="text-green-600 text-xs md:text-sm">↑ {trend.value}%</span>
              ) : (
                <span className="text-red-600 text-xs md:text-sm">↓ {trend.value}%</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`${colorClasses[color]} p-2 md:p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Grid responsive pour les stat cards
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}

export const ResponsiveStatGrid: React.FC<ResponsiveGridProps> = ({ children, cols = 3 }) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClass[cols]} gap-3 md:gap-6`}>
      {children}
    </div>
  );
};

/**
 * Table responsive avec scroll horizontal sur mobile
 */
interface ResponsiveTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  isLoading?: boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  rows,
  isLoading = false,
  emptyMessage = 'Aucune donnée',
  itemsPerPage = 10,
}) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedData,
    setCurrentPage,
  } = useTablePagination(rows, { itemsPerPage });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-3 md:px-6 py-4 text-center text-sm text-gray-600">
                  Chargement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-3 md:px-6 py-4 text-center text-sm text-gray-600">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && rows.length > 0 && (
        <div className="px-3 md:px-6 pb-4 border-t border-gray-100">
          <TablePaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Layout principal responsive pour dashboard
 */
interface ResponsiveDashboardLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  header,
  children,
  sidebar,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 md:px-6 lg:px-8 py-4">
          {header}
        </div>
      </div>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar (hidden on mobile) */}
        {sidebar && (
          <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
            {sidebar}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-4 md:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Header responsive
 */
interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  subtitle,
  actions,
  icon,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="text-gray-600">{icon}</div>}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
        </div>
        {subtitle && <p className="text-sm md:text-base text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
};

/**
 * Card responsive avec padding adapté
 */
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Filter bar responsive
 */
interface ResponsiveFilterProps {
  children: React.ReactNode;
}

export const ResponsiveFilterBar: React.FC<ResponsiveFilterProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 overflow-x-auto">
      <div className="flex gap-2 flex-wrap md:flex-nowrap">{children}</div>
    </div>
  );
};
