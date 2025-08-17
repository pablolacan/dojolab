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
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  headerActions?: ReactNode;
}

export const DataTable = <T extends Record<string, any>>({
  title,
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = "No hay datos disponibles",
  className = '',
  headerActions
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden ${className}`}
    >
      {title && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 text-subheading">{title}</h2>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      )}
      
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
                  <p className="text-gray-500 text-sm text-body">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};