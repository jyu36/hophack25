import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
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
      sectionBg: "bg-blue-50/50",
      sectionBorder: "border-blue-200",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      text: "text-purple-900",
      iconText: "text-purple-600",
      contentText: "text-purple-800",
      sectionBg: "bg-purple-50/50",
      sectionBorder: "border-purple-200",
    },
  };

  const currentColors = colors[colorScheme];

  // 格式化内容为结构化显示
  interface Section {
    title: string;
    content: string[];
  }

  const formatContent = (rawContent: string): Section[] => {
    const lines = rawContent.split('\n').filter(line => line.trim());
    // Simplistic formatting: just treat each line as a paragraph or a simple section
    return [{ title: '', content: lines }];
  };

  const formattedSections = formatContent(content);

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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {formattedSections.map((section, index) => (
              <div key={index} className="space-y-2">
                {/* Only display content, ignore title if empty */}
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className={`text-sm ${currentColors.contentText} leading-relaxed`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
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
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
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
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading summaries
                </h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => fetchSummaries(true)}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Project Overview */}
          <div className="border border-blue-100 rounded-lg bg-blue-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="font-medium text-blue-900">
                    Project Overview
                  </h3>
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
                  <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-blue-600">
                    Loading project overview...
                  </p>
                </div>
              ) : (
                <div className="text-sm text-blue-800">
                  <div className="px-1 line-clamp-4">
                    {projectSummary}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Update */}
          <div className="border border-purple-100 rounded-lg bg-purple-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Weekly Update</h3>
                </div>
                <button
                  onClick={() => setIsWeeklyModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center rounded-md bg-purple-100 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                  View Full
                </button>
              </div>
            </div>
            <div className="px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-b-2 border-purple-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-purple-600">
                    Loading weekly update...
                  </p>
                </div>
              ) : (
                <div className="text-sm text-purple-800">
                  <div className="px-1 line-clamp-4">
                    {weeklyUpdate}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Presentation */}
          <button
            disabled={isLoading}
            className="flex items-center justify-center w-full p-3 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Presentation className="w-5 h-5" />
            <span>Download Latest Presentation</span>
          </button>
        </div>

        <div className="mt-4 text-xs text-right text-gray-500">
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
        icon={<Brain className="w-5 h-5" />}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        colorScheme="blue"
      />

      <FullViewModal
        title="Weekly Update"
        content={weeklyUpdate}
        icon={<Calendar className="w-5 h-5" />}
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        colorScheme="purple"
      />
    </>
  );
};

export default AISummary;
