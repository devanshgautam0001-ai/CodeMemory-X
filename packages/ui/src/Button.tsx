import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-accent';
  
  const variants = {
    primary: 'bg-button-primary hover:bg-button-primary-hover text-button-primary-text shadow-sm',
    secondary: 'bg-button-secondary hover:bg-button-secondary-hover text-button-secondary-text border border-border',
    ghost: 'bg-transparent hover:bg-hover text-text-primary',
    danger: 'bg-danger text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
