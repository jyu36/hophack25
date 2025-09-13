import React, { useState, useEffect, useCallback } from 'react';
import { GripHorizontal } from 'lucide-react';

interface ResizableHorizontalDividerProps {
  onResize: (newTopHeight: number) => void;
  minHeight?: number;
  maxHeight?: number;
}

const ResizableHorizontalDivider: React.FC<ResizableHorizontalDividerProps> = ({
  onResize,
  minHeight = 200,
  maxHeight = 800,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const containerElement = (e.target as HTMLElement).closest('.flex-col');
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const newHeight = e.clientY - containerRect.top - 50; // Adjust for header
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          onResize(newHeight);
        }
      }
    }
  }, [isDragging, minHeight, maxHeight, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Add cursor style to body when dragging
      document.body.style.cursor = 'row-resize';
      // Disable text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Reset cursor and text selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`h-2 bg-gray-100 hover:bg-blue-50 cursor-row-resize group relative transition-all duration-200 ${
        isDragging ? 'bg-blue-100' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Center line */}
      <div className={`absolute top-1/2 left-0 right-0 h-[2px] transform -translate-y-1/2 ${
        isDragging ? 'bg-blue-400' : 'bg-gray-300 group-hover:bg-blue-300'
      }`} />

      {/* Grip icon */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity ${
        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <GripHorizontal className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
      </div>

      {/* Hover indicators */}
      <div className="absolute inset-x-0 -top-1 h-1 group-hover:bg-blue-100/50" />
      <div className="absolute inset-x-0 -bottom-1 h-1 group-hover:bg-blue-100/50" />
    </div>
  );
};

export default ResizableHorizontalDivider;