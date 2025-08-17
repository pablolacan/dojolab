interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState = ({
  title = "Error al cargar",
  message,
  onRetry,
  retryText = "Reintentar",
  className = ''
}: ErrorStateProps) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="w-12 h-12 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-gray-900 text-lg font-semibold mb-2 text-subheading">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-4 text-body">
        {message}
      </p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-200 text-caption font-medium"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};