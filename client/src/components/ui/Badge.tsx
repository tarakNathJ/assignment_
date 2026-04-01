import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'critical' | 'stable' | 'optional';
  children: React.ReactNode;
  pill?: boolean;
}

export function Badge({ 
  variant = 'default', 
  children, 
  pill = true,
  className = '', 
  ...props 
}: BadgeProps) {
  const baseClass = 'cyber-badge';
  let variantClass = '';
  
  // Map legacy variants to new ones
  if (variant === 'critical' || variant === 'danger') variantClass = 'badge-danger';
  else if (variant === 'stable' || variant === 'success') variantClass = 'badge-success';
  else if (variant === 'optional') variantClass = 'badge-default';
  else if (variant === 'info') variantClass = 'badge-info';
  else if (variant === 'warning') variantClass = 'badge-warning';
  else variantClass = 'badge-default';
  
  const shapeClass = pill ? 'badge-pill' : 'badge-rounded';
  
  return (
    <span className={`${baseClass} ${variantClass} ${shapeClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
