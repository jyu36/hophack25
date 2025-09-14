import React, { useState } from "react";
import { Check, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { Experiment } from "../../types/research";
import { formatDate } from "../../utils/helpers";
import LiteratureSuggestions from "./LiteratureSuggestions";

interface ExperimentCardProps {
  experiment: Experiment;
  className?: string;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-lg border border-gray-200 hover:bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div
            className={`rounded-full p-1 ${
              experiment.status === "completed"
                ? "bg-green-100"
                : experiment.status === "postponed"
                ? "bg-red-100"
                : "bg-yellow-100"
            }`}
          >
            {experiment.status === "completed" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : experiment.status === "postponed" ? (
              <X className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <h4 className="font-medium text-gray-900 w-48 break-words">
            {experiment.title}
          </h4>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {formatDate(experiment.created_at)}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-4">
            <div>
              <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50/50">
                <h5 className="text-sm font-medium text-gray-700">Motivation</h5>
              </div>
              <p className="mt-2 text-sm text-gray-600 px-1">
                {experiment.motivation || "No motivation provided"}
              </p>
            </div>
            <div>
              <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50/50">
                <h5 className="text-sm font-medium text-gray-700">Basic Results</h5>
              </div>
              <p className="mt-2 text-sm text-gray-600 px-1">
                {experiment.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Literature Suggestions - Always visible */}
      <div className="border-t border-gray-200 p-4">
        <LiteratureSuggestions
          nodeId={experiment.id}
          experimentTitle={experiment.title}
        />
      </div>
    </div>
  );
};

export default ExperimentCard;
