import React, { useState } from "react";
import { Check, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { Experiment } from "../../types/research";
import { formatDate } from "../../utils/helpers";
import LiteratureSuggestions from "./LiteratureSuggestions";

interface ExperimentCardProps {
  experiment: Experiment;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 hover:bg-gray-50">
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
              <h5 className="text-sm font-medium text-gray-700">Motivation</h5>
              <p className="mt-1 text-sm text-gray-600">
                {experiment.motivation || "No motivation provided"}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">
                Basic Results
              </h5>
              <p className="mt-1 text-sm text-gray-600">
                {experiment.description}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Keywords</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {experiment.keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
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
