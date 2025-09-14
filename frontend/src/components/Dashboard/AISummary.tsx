import React, { useState, useEffect } from "react";
import {
  Brain,
  Calendar,
  Presentation,
  RefreshCw,
  Maximize2,
  X,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import {
  getOverviewSummary,
  getWeeklySummary,
  SummaryResponse,
} from "../../utils/api";

interface AISummaryProps {
  // Optional props for backward compatibility, but component will fetch its own data
  projectSummary?: string;
  weeklyUpdate?: string;
  lastUpdated?: string | Date;
}

interface FullViewModalProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  colorScheme: "blue" | "purple";
}

const FullViewModal: React.FC<FullViewModalProps> = ({
  title,
  content,
  icon,
  isOpen,
  onClose,
  colorScheme,
}) => {
  if (!isOpen) return null;

  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-900",
      iconText: "text-blue-600",
      contentText: "text-blue-800",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      text: "text-purple-900",
      iconText: "text-purple-600",
      contentText: "text-purple-800",
    },
  };

  const currentColors = colors[colorScheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`relative w-full max-w-2xl rounded-xl ${currentColors.bg} ${currentColors.border} border shadow-xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-opacity-20">
          <div className="flex items-center space-x-2">
            <div className={currentColors.iconText}>{icon}</div>
            <h3 className={`font-medium ${currentColors.text}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-white hover:bg-opacity-20 ${currentColors.iconText}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <p
            className={`text-sm whitespace-pre-wrap ${currentColors.contentText}`}
          >
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

const AISummary: React.FC<AISummaryProps> = ({
  projectSummary: propProjectSummary,
  weeklyUpdate: propWeeklyUpdate,
  lastUpdated: propLastUpdated,
}) => {
  // State for fetched data
  const [projectSummary, setProjectSummary] = useState<string>(
    propProjectSummary || "AI is analyzing your project..."
  );
  const [weeklyUpdate, setWeeklyUpdate] = useState<string>(
    propWeeklyUpdate || "Generating weekly insights..."
  );
  const [lastUpdated, setLastUpdated] = useState<string | Date>(
    propLastUpdated || "Just now"
  );

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<SummaryResponse | null>(
    null
  );
  const [weeklyData, setWeeklyData] = useState<SummaryResponse | null>(null);

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);

  // Fetch summary data
  const fetchSummaries = async (ignoreCache = false) => {
    try {
      setError(null);
      const [overviewResponse, weeklyResponse] = await Promise.all([
        getOverviewSummary(ignoreCache),
        getWeeklySummary(ignoreCache),
      ]);

      setOverviewData(overviewResponse);
      setWeeklyData(weeklyResponse);
      setProjectSummary(overviewResponse.summary);
      setWeeklyUpdate(weeklyResponse.summary);
      setLastUpdated(new Date(overviewResponse.generated_at));
    } catch (err) {
      console.error("Error fetching summaries:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load summaries";

      // If it's a network error, provide more helpful message
      if (
        errorMessage.includes("Network Error") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED")
      ) {
        setError(
          "Assistant API server is not running. Please start the assistant server on port 3001."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSummaries(true); // Force refresh by ignoring cache
  };

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            AI Research Assistant
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading summaries
                </h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => fetchSummaries(true)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Project Overview */}
          <div className="rounded-lg border border-blue-100 bg-blue-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">
                    Project Overview
                  </h3>
                  {overviewData && (
                    <span className="ml-2 text-xs text-blue-600">
                      ({overviewData.node_count} nodes,{" "}
                      {overviewData.edge_count} edges)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center rounded-md bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  View Full
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-600">
                    Loading project overview...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-800 whitespace-pre-wrap line-clamp-3">
                  {projectSummary}
                </p>
              )}
            </div>
          </div>

          {/* Weekly Update */}
          <div className="rounded-lg border border-purple-100 bg-purple-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Weekly Update</h3>
                  {weeklyData && (
                    <span className="ml-2 text-xs text-purple-600">
                      ({weeklyData.node_count} nodes, {weeklyData.edge_count}{" "}
                      edges)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsWeeklyModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center rounded-md bg-purple-100 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  View Full
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-purple-600">
                    Loading weekly update...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-purple-800 whitespace-pre-wrap line-clamp-3">
                  {weeklyUpdate}
                </p>
              )}
            </div>
          </div>

          {/* Download Presentation */}
          <button
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Presentation className="h-5 w-5" />
            <span>Download Latest Presentation</span>
          </button>
        </div>

        <div className="mt-4 text-right text-xs text-gray-500">
          Last updated: {formatDate(lastUpdated)}
          {overviewData?.cache_hit && (
            <span className="ml-2 text-green-600">(cached)</span>
          )}
        </div>
      </div>

      {/* Full View Modals */}
      <FullViewModal
        title="Project Overview"
        content={projectSummary}
        icon={<Brain className="h-5 w-5" />}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        colorScheme="blue"
      />

      <FullViewModal
        title="Weekly Update"
        content={weeklyUpdate}
        icon={<Calendar className="h-5 w-5" />}
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        colorScheme="purple"
      />
    </>
  );
};

export default AISummary;
