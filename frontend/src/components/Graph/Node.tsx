import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ResearchNode } from "../../types/research";

interface CustomNodeData extends ResearchNode {
  onNodeDoubleClick: (node: ResearchNode) => void;
}

const statusColors = {
  completed: "bg-green-500 border-green-600",
  planned: "bg-yellow-500 border-yellow-600",
  postponed: "bg-red-500 border-red-600",
};

const typeIcons = {
  hypothesis: "🤔",
  experiment: "🧪",
  result: "📊",
  analysis: "📝",
};

const CustomNode = ({ data }: NodeProps<CustomNodeData>) => {
  const handleDoubleClick = () => {
    data.onNodeDoubleClick(data);
  };

  return (
    <div
      className={`relative rounded-lg border-2 ${
        statusColors[data.status]
      } p-3 shadow-lg cursor-pointer
        transition-all duration-200 hover:shadow-xl hover:scale-105`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="min-w-[200px] max-w-[300px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{typeIcons[data.type]}</span>
          <h3 className="font-medium text-white w-48 break-words">{data.title}</h3>
        </div>

        <p className="mb-2 text-xs text-white/90 line-clamp-2">
          {data.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {data.keywords?.slice(0, 3).map((keyword, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full text-white"
            >
              {keyword}
            </span>
          ))}
          {data.keywords && data.keywords.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full text-white">
              +{data.keywords.length - 3}
            </span>
          )}
        </div>

        {data.solutions && data.solutions.length > 0 && (
          <div className="mt-2 text-[10px] text-white/80">
            {data.solutions.length} solution
            {data.solutions.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </div>
  );
};

const MemoizedNode = memo(CustomNode);
export default MemoizedNode;
