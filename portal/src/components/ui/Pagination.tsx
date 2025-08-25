// src/components/ui/Pagination.tsx

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPreviousNext?: boolean;
  showPageNumbers?: boolean;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext = true,
  showPageNumbers = true,
  disabled = false
}) => {
  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center space-x-2" role="navigation">
      {showPreviousNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {showPageNumbers && generatePageNumbers().map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-2">
              <MoreHorizontal className="h-4 w-4 text-zinc-400" />
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={cn(
              currentPage === page && "bg-lime-300 text-zinc-900 hover:bg-lime-400"
            )}
          >
            {page}
          </Button>
        );
      })}

      {showPreviousNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
};

// Simple load more button for infinite scroll
interface LoadMoreProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  disabled?: boolean;
}

export const LoadMore: React.FC<LoadMoreProps> = ({
  onLoadMore,
  hasMore,
  isLoading,
  disabled = false
}) => {
  if (!hasMore) {
    return (
      <p className="text-center text-sm text-zinc-400 py-4">
        No more items to load
      </p>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        loading={isLoading}
        disabled={disabled || isLoading}
      >
        Load More
      </Button>
    </div>
  );
};

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-zinc-600 border-t-lime-300",
        sizeClasses[size],
        className
      )}
    />
  );
};

// Full page loading
export const LoadingPage: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-zinc-400">{message}</p>
      </div>
    </div>
  );
};

// Loading skeleton
interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  rows = 1 
}) => {
  if (rows === 1) {
    return (
      <div
        className={cn(
          "animate-pulse bg-zinc-800 rounded",
          className
        )}
      />
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-zinc-800 rounded h-4",
            i === rows - 1 && "w-3/4", // Last row is shorter
            className
          )}
        />
      ))}
    </div>
  );
};

// Table loading skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
}> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-10",
                colIndex === 0 ? "flex-1" : "w-24"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};