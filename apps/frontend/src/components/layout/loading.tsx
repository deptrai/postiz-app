'use client';

// Temporarily replaced react-loading with custom spinner to avoid React version conflicts
import { FC } from 'react';
export const LoadingComponent: FC<{
  width?: number;
  height?: number;
}> = (props) => {
  const size = props.width || 100;
  return (
    <div className="flex-1 flex justify-center pt-[100px]">
      <div 
        className="animate-spin rounded-full border-4 border-gray-300 border-t-[#612bd3]"
        style={{ 
          width: `${size}px`, 
          height: `${size}px` 
        }}
      />
    </div>
  );
};
