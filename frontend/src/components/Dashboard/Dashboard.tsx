import React, { useState, useEffect, useMemo } from "react";
import { LayoutGrid, Lightbulb, Network, Clock, GitBranch } from "lucide-react";
import StatsCard from "./StatsCard";
import RecentExperiments from "./RecentExperiments";
import TopicExtractor from "../TopicExtractor/TopicExtractor";
import AllExperiments from "../Experiments/AllExperiments";
import AllFutureExperiments from "../Experiments/AllFutureExperiments";
import AISummary from "./AISummary";
import { Experiment, ExperimentSuggestion } from "../../types/research";
import { useExperiments } from "../../hooks/useExperiments";

interface DashboardProps {
  onNewExperiment: () => void;
  onViewGraph: () => void;
  onSuggestionsGenerated: (suggestions: ExperimentSuggestion[]) => void;
}

type ExperimentTab = "all" | "past" | "planned" | "postponed";

const Dashboard: React.FC<DashboardProps> = ({
  onNewExperiment,
  onViewGraph,
  onSuggestionsGenerated,
}) => {
  const [showTopicExtractor, setShowTopicExtractor] = useState(false);
  const [activeTab, setActiveTab] = useState<ExperimentTab>("all");
  const [view, setView] = useState<"dashboard" | "allPast" | "allFuture">(
    "dashboard"
  );

  const {
    experiments: filteredExperiments,
    isLoading,
    error,
    refreshExperiments,
    getExperimentsByStatus,
  } = useExperiments();

  // Fetch experiments when tab changes
  useEffect(() => {
    refreshExperiments();
  }, [activeTab, refreshExperiments]);

  // Filter and sort experiments based on the active tab
  const filteredAndSortedExperiments = useMemo(() => {
    let experimentsToFilter = [...filteredExperiments];

    if (activeTab === "past") {
      experimentsToFilter = experimentsToFilter.filter(
        (exp) => exp.status === "completed"
      );
    } else if (activeTab === "planned") {
      experimentsToFilter = experimentsToFilter.filter(
        (exp) => exp.status === "planned"
      );
    } else if (activeTab === "postponed") {
      experimentsToFilter = experimentsToFilter.filter(
        (exp) => exp.status === "postponed"
      );
    }

    return experimentsToFilter.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredExperiments, activeTab]);

  const counts = useMemo(() => ({
    total: filteredExperiments.length,
    completed: getExperimentsByStatus("completed").length,
    planned: getExperimentsByStatus("planned").length,
    postponed: getExperimentsByStatus("postponed").length,
    past: getExperimentsByStatus("completed").length
  }), [filteredExperiments, getExperimentsByStatus]);

  const tabs: { id: ExperimentTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.total },
    { id: "past", label: "Completed", count: counts.past },
    { id: "planned", label: "Planned", count: counts.planned },
    { id: "postponed", label: "Postponed", count: counts.postponed },
  ];

  if (view === "allPast") {
    return (
      <AllExperiments
        experiments={filteredAndSortedExperiments}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "allFuture") {
    return (
      <AllFutureExperiments
        experiments={filteredAndSortedExperiments}
        onBack={() => setView("dashboard")}
        onNewExperiment={onNewExperiment}
      />
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Research Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your research experiments and progress
          </p>
        </div>

        {/* Stats Overview Module */}
        <div className="p-8 mb-8 bg-white shadow-xl rounded-xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Research Statistics Overview
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Experiments"
              value={counts.total}
              icon={LayoutGrid}
              description="All research experiments"
              trend={{ value: counts.total, label: "total" }}
            />
            <StatsCard
              title="Completed Experiments"
              value={counts.completed}
              icon={Lightbulb}
              description="Successfully completed experiments"
              trend={{
                value: counts.completed,
                label: "completed",
                positive: true,
              }}
            />
            <StatsCard
              title="Planned Experiments"
              value={counts.planned}
              icon={Clock}
              description="Experiments for later consideration"
              trend={{ value: counts.planned, label: "planned" }}
            />
            <StatsCard
              title="Connected Ideas"
              value={counts.total > 1 ? counts.total - 1 : 0}
              icon={GitBranch}
              description="Relationships between experiments"
              trend={{ value: counts.total - 1, label: "connections" }}
            />
            <button
              onClick={onViewGraph}
              className="flex flex-col items-center justify-center h-full p-6 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Network className="w-10 h-10 mb-2" />
              <span className="text-sm font-medium">View Research Graph</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Experiments Section */}
          <div className="bg-white rounded-lg shadow">
            {/* Tabs Header */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Experiments
                </h2>
              </div>
              <div className="flex px-6 mt-4 space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative min-w-[100px] px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span className="flex items-center justify-center">
                      {tab.label}
                      <span
                        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                          activeTab === tab.id
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </span>
                    {/* Active tab indicator */}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="h-[calc(100vh-32rem)] min-h-[400px] overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    Loading experiments...
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-500">{error}</div>
                </div>
              ) : filteredAndSortedExperiments.length > 0 ? (
                <RecentExperiments experiments={filteredAndSortedExperiments} />
              ) : (
                <div className="flex items-center justify-center h-full p-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      No experiments found in this category.
                    </p>
                    {activeTab === "planned" && (
                      <button
                        onClick={onNewExperiment}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Create New Experiment
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary Section */}
          <AISummary
            projectSummary="Your research focuses on exploring novel approaches to machine learning optimization, with 5 completed experiments showing promising results in gradient descent techniques. Recent findings suggest a 23% improvement in convergence speed."
            weeklyUpdate="This week: 2 new experiments were completed, focusing on adaptive learning rates. Key achievement: Developed a new momentum-based approach that reduced training time by 15%."
            lastUpdated={new Date()}
          />
        </div>
      </div>

      {/* Topic Extractor Modal */}
      {showTopicExtractor && (
        <TopicExtractor
          onTopicsGenerated={(suggestions) => {
            onSuggestionsGenerated(suggestions);
            setShowTopicExtractor(false);
          }}
          onClose={() => setShowTopicExtractor(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;