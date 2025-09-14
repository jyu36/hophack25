import React, { useState, useCallback } from "react";
import { Maximize2, RotateCcw, Hand } from "lucide-react";
import { ReactFlowInstance } from "reactflow";

interface CustomZoomControlsProps {
  reactFlowInstance: ReactFlowInstance | null;
  isPanMode: boolean;
  onPanModeToggle: () => void;
}

const CustomZoomControls: React.FC<CustomZoomControlsProps> = ({
  reactFlowInstance,
  isPanMode,
  onPanModeToggle,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const updateZoomLevel = useCallback(() => {
    if (reactFlowInstance) {
      setZoomLevel(reactFlowInstance.getZoom());
    }
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  const handleResetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
      setZoomLevel(1);
    }
  }, [reactFlowInstance]);

  const handleZoomSlider = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (reactFlowInstance) {
        const newZoom = parseFloat(event.target.value);
        const viewport = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport({ ...viewport, zoom: newZoom });
        setZoomLevel(newZoom);
      }
    },
    [reactFlowInstance]
  );

  // Update zoom level when ReactFlow instance changes
  React.useEffect(() => {
    if (reactFlowInstance) {
      updateZoomLevel();
    }
  }, [reactFlowInstance, updateZoomLevel]);

  return (
    <div className="absolute top-4 left-4 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100/50 p-1.5 flex flex-col gap-2 z-50">
      <div className="flex flex-col gap-1">
        <button
          onClick={handleFitView}
          className="p-1.5 hover:bg-white/60 rounded transition-colors"
          title="Fit View (Ctrl + 0)"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 hover:bg-white/60 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={onPanModeToggle}
          className={`p-1.5 rounded transition-colors ${
            isPanMode ? "bg-blue-100/80 text-blue-600" : "hover:bg-white/60"
          }`}
          title="Toggle Pan Mode (Space)"
        >
          <Hand size={14} />
        </button>
      </div>

      <div className="relative w-6 h-24">
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomSlider}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 -rotate-90 bg-gray-200/80 rounded-lg appearance-none cursor-pointer slider"
          title="Zoom Level"
        />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-600 whitespace-nowrap">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};

export default CustomZoomControls;
