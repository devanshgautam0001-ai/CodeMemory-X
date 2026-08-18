import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
}) => {
  return (
    <div
      className={`bg-hover/60 animate-pulse rounded ${className}`}
      style={{ width, height }}
    />
  );
};
