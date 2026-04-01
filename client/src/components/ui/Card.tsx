import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverLift?: boolean;
}

export function Card({ 
  children, 
  title, 
  action, 
  variant = 'default',
  hoverLift = true,
  className = '', 
  ...props 
}: CardProps) {
  const variantClass = variant === 'elevated' 
    ? 'card-elevated' 
    : variant === 'outlined' 
      ? 'card-outlined' 
      : 'card-default';
  
  const hoverClass = hoverLift ? 'card-hover-lift' : '';
  
  return (
    <div className={`glass-panel ${variantClass} ${hoverClass} ${className}`} {...props}>
      {(title || action) && (
        <div className="flex-between mb-4">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}
