import React, { useState, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onResize: (newLeftWidth: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  minWidth = 300,
  maxWidth = 800,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onResize(newWidth);
      }
    }
  }, [isDragging, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Add cursor style to body when dragging
      document.body.style.cursor = 'col-resize';
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
      className={`w-2 hover:w-3 bg-gray-200 hover:bg-blue-400 cursor-col-resize group relative transition-all duration-200 ${
        isDragging ? 'w-3 bg-blue-500' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity ${
        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* Hover indicators */}
      <div className="absolute inset-y-0 -left-2 w-2 group-hover:bg-blue-400/10" />
      <div className="absolute inset-y-0 -right-2 w-2 group-hover:bg-blue-400/10" />

      {/* Active drag indicators */}
      {isDragging && (
        <>
          <div className="absolute inset-y-0 -left-2 w-2 bg-blue-500/10" />
          <div className="absolute inset-y-0 -right-2 w-2 bg-blue-500/10" />
        </>
      )}
    </div>
  );
};

export default ResizableDivider;