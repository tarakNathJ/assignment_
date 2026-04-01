import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cyan' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  icon, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClass = 'cyber-btn';
  let variantClass = '';
  let sizeClass = '';
  
  if (variant === 'primary') variantClass = 'cyber-btn-primary';
  if (variant === 'cyan') variantClass = 'cyber-btn-cyan';
  if (variant === 'outline') variantClass = 'cyber-btn-outline';
  if (variant === 'ghost') variantClass = 'cyber-btn-ghost';
  
  if (size === 'sm') sizeClass = 'cyber-btn-sm';
  if (size === 'md') sizeClass = 'cyber-btn-md';
  if (size === 'lg') sizeClass = 'cyber-btn-lg';
  
  const isDisabled = disabled || loading;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`} 
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 
          size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} 
          className="animate-spin" 
          style={{ marginRight: children ? 8 : 0 }}
        />
      )}
      {!loading && icon && (
        <span className="btn-icon">{icon}</span>
      )}
      {children}
    </button>
  );
}
