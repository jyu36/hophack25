import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ExternalLink,
  Plus,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getLiteratureSuggestion,
  addLiterature,
  LiteratureItem,
} from "../../utils/api";
import { message } from "antd";

interface LiteratureSuggestionsProps {
  nodeId: number;
  experimentTitle: string;
}

const LiteratureSuggestions: React.FC<LiteratureSuggestionsProps> = ({
  nodeId,
  experimentTitle,
}) => {
  const [suggestions, setSuggestions] = useState<LiteratureItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedPapers, setAddedPapers] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      // Fetch just one literature suggestion
      const suggestion = await getLiteratureSuggestion(
        nodeId,
        "similar",
        true,
        []
      );

      if (suggestion && !suggestion._error) {
        setSuggestions([suggestion]);
      } else {
        setSuggestions([]);
        message.error(
          "Failed to load literature suggestion. Please try again."
        );
      }
    } catch (error) {
      console.error("Error fetching literature suggestion:", error);
      message.error("Failed to load literature suggestion. Please try again.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLiterature = async (paper: LiteratureItem) => {
    try {
      await addLiterature(nodeId, paper.url, paper.relationship);
      setAddedPapers((prev) => {
        const newSet = new Set(prev);
        newSet.add(paper.url);
        return newSet;
      });
      message.success("Literature added successfully!");
    } catch (error) {
      console.error("Error adding literature:", error);
      message.error("Failed to add literature");
    }
  };

  const handleRemoveLiterature = (paper: LiteratureItem) => {
    setAddedPapers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(paper.url);
      return newSet;
    });
  };

  const getRelationshipLabel = (relationship: string) => {
    switch (relationship) {
      case "similar":
        return "Similar Work";
      case "builds_on":
        return "Builds On";
      case "prior":
        return "Prior Work";
      case "contrast":
        return "Contrasting Work";
      default:
        return "Related Work";
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case "similar":
        return "bg-blue-100 text-blue-800";
      case "builds_on":
        return "bg-green-100 text-green-800";
      case "prior":
        return "bg-purple-100 text-purple-800";
      case "contrast":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h6 className="text-sm font-medium text-gray-700 flex items-center">
          <BookOpen className="h-4 w-4 mr-1" />
          Literature Suggestion
        </h6>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Loading..." : "Get Suggestion"}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">
                Loading suggestion...
              </span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((paper, index) => (
              <div
                key={paper.id || index}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(
                          paper.relationship
                        )}`}
                      >
                        {getRelationshipLabel(paper.relationship)}
                      </span>
                      {paper.confidence && (
                        <span className="text-xs text-gray-500">
                          {Math.round(paper.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    <h7 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {paper.title || "No title available"}
                    </h7>

                    <div className="mt-1 text-xs text-gray-600">
                      {paper.venue && <span>{paper.venue}</span>}
                      {paper.year && (
                        <span className="ml-1">({paper.year})</span>
                      )}
                    </div>

                    {paper.summary && (
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {paper.summary}
                      </p>
                    )}

                    <div className="mt-2 flex items-center space-x-2">
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Paper
                      </a>
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          DOI: {paper.doi}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 flex-shrink-0">
                    {addedPapers.has(paper.url) ? (
                      <button
                        onClick={() => handleRemoveLiterature(paper)}
                        className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddLiterature(paper)}
                        className="flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No literature suggestion available
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try clicking "Get Suggestion" to find a related paper
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiteratureSuggestions;
