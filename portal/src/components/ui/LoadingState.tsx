interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState = ({ 
  message = "Cargando...", 
  size = 'md',
  className = '' 
}: LoadingStateProps) => {
  const getSizeStyles = (size: string) => {
    const styles = {
      sm: { spinner: "w-4 h-4", text: "text-xs" },
      md: { spinner: "w-8 h-8", text: "text-sm" },
      lg: { spinner: "w-12 h-12", text: "text-base" }
    };
    return styles[size as keyof typeof styles] || styles.md;
  };

  const sizeStyles = getSizeStyles(size);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className={`${sizeStyles.spinner} border-2 border-gray-200 border-t-[#c9f31d] rounded-full animate-spin`}></div>
      <p className={`text-gray-600 ${sizeStyles.text} text-body`}>{message}</p>
    </div>
  );
};