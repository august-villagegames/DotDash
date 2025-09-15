interface LogoProps {
  variant?: 'default' | 'light' | 'mark-only';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'default', className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  if (variant === 'mark-only') {
    return (
      <svg 
        className={`${sizeClasses[size]} w-auto ${className}`} 
        viewBox="0 0 48 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="8" fill="currentColor" />
        <rect x="32" y="14" width="16" height="4" rx="2" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'light') {
    return (
      <svg 
        className={`${sizeClasses[size]} w-auto ${className}`} 
        viewBox="0 0 120 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="16" cy="16" r="8" fill="#A855F7" />
        <rect x="32" y="14" width="16" height="4" rx="2" fill="#A855F7" />
        <text x="58" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#F9FAFB">
          DotDash
        </text>
      </svg>
    );
  }

  return (
    <svg 
      className={`${sizeClasses[size]} w-auto ${className}`} 
      viewBox="0 0 120 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="8" fill="#6B46C1" />
      <rect x="32" y="14" width="16" height="4" rx="2" fill="#6B46C1" />
      <text x="58" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1F2937">
        DotDash
      </text>
    </svg>
  );
}
