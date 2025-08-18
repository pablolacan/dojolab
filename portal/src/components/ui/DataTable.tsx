import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TableColumn<T = any> {
  id: string;
  label: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => ReactNode;
}

interface DataTableProps<T = any> {
  title?: string;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  headerActions?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  renderEmptyState?: () => ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export const DataTable = <T extends Record<string, any>>({
  title,
  columns,
  data,
  loading = false,
  error,
  onRowClick,
  emptyMessage = "No hay datos disponibles",
  className = '',
  headerActions,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onRefresh,
  renderEmptyState,
  actionButton
}: DataTableProps<T>) => {
  const getCellValue = (item: T, column: TableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor];
  };

  const renderCellContent = (item: T, column: TableColumn<T>, index: number) => {
    const value = getCellValue(item, column);
    
    if (column.render) {
      return column.render(value, item, index);
    }
    
    return value;
  };

  const getAlignmentClass = (align?: string) => {
    const alignments = {
      left: 'text-left',
      center: 'text-center', 
      right: 'text-right'
    };
    return alignments[align as keyof typeof alignments] || 'text-left';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden ${className}`}>
        {title && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              {headerActions && <div>{headerActions}</div>}
            </div>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#c9f31d] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm text-body">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl border border-red-100 shadow-card overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-800 text-sm font-medium mb-2">Error al cargar los datos</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden ${className}`}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-gray-900 text-subheading">{title}</h2>}
          <div className="flex items-center space-x-4">
            {searchValue !== undefined && (
              <div className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder || "Buscar..."}
                  className="w-64 px-4 py-2 pl-10 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#c9f31d] focus:border-transparent"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9f31d] focus:ring-offset-2 text-sm font-medium"
              >
                {actionButton.icon && <span className="mr-2">{actionButton.icon}</span>}
                {actionButton.label}
              </button>
            )}
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-6 py-4 text-gray-700 text-sm font-semibold text-caption ${getAlignmentClass(column.align)}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((item, index) => (
                <motion.tr
                  key={item.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`hover:bg-gray-50 transition-all duration-200 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-6 py-4 ${getAlignmentClass(column.align)}`}
                    >
                      {renderCellContent(item, column, index)}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center">
                  {renderEmptyState ? renderEmptyState() : (
                    <p className="text-gray-500 text-sm text-body">{emptyMessage}</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};