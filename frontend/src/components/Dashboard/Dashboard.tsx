import React, { useState } from "react";
import { LayoutGrid, Lightbulb, Network, Clock, GitBranch } from "lucide-react";
import StatsCard from "./StatsCard";
import RecentExperiments from "./RecentExperiments";
import TopicExtractor from "../TopicExtractor/TopicExtractor";
import AllExperiments from "../Experiments/AllExperiments";
import AllFutureExperiments from "../Experiments/AllFutureExperiments";
import AISummary from "./AISummary";
import { Experiment, ExperimentSuggestion } from "../../types/research";

interface DashboardProps {
  experiments: Experiment[];
  onNewExperiment: () => void;
  onViewGraph: () => void;
  onSuggestionsGenerated: (suggestions: ExperimentSuggestion[]) => void;
}

type ExperimentTab = "all" | "completed" | "planned" | "rejected";

const Dashboard: React.FC<DashboardProps> = ({
  experiments,
  onNewExperiment,
  onViewGraph,
  onSuggestionsGenerated,
}) => {
  const [showTopicExtractor, setShowTopicExtractor] = useState(false);
  const [activeTab, setActiveTab] = useState<ExperimentTab>("all");

  const completedCount = experiments.filter(
    (e) => e.status === "completed"
  ).length;
  const plannedCount = experiments.filter((e) => e.status === "planned").length;
  const rejectedCount = experiments.filter(
    (e) => e.status === "rejected"
  ).length;
  const totalCount = experiments.length;

  const getFilteredExperiments = () => {
    const sortedExperiments = [...experiments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    switch (activeTab) {
      case "all":
        return sortedExperiments;
      case "completed":
        return sortedExperiments.filter((e) => e.status === "completed");
      case "planned":
        return sortedExperiments.filter((e) => e.status === "planned");
      case "rejected":
        return sortedExperiments.filter((e) => e.status === "rejected");
      default:
        return sortedExperiments;
    }
  };

  const tabs: { id: ExperimentTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "planned", label: "Planned", count: plannedCount },
    { id: "rejected", label: "Rejected", count: rejectedCount },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
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
        <div className="mb-8 rounded-xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Research Statistics Overview
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Experiments"
              value={totalCount}
              icon={LayoutGrid}
              description="All research experiments"
              trend={{ value: totalCount, label: "total" }}
            />
            <StatsCard
              title="Completed Experiments"
              value={completedCount}
              icon={Lightbulb}
              description="Successfully completed experiments"
              trend={{
                value: completedCount,
                label: "completed",
                positive: true,
              }}
            />
            <StatsCard
              title="Rejected Experiments"
              value={rejectedCount}
              icon={Clock}
              description="Experiments that were rejected"
              trend={{ value: rejectedCount, label: "rejected" }}
            />
            <StatsCard
              title="Connected Ideas"
              value={experiments.length > 1 ? experiments.length - 1 : 0}
              icon={GitBranch}
              description="Relationships between experiments"
              trend={{ value: experiments.length - 1, label: "connections" }}
            />
            <button
              onClick={onViewGraph}
              className="flex h-full flex-col items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <Network className="mb-2 h-10 w-10" />
              <span className="text-sm font-medium">View Research Graph</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Experiments Section */}
          <div className="rounded-lg bg-white shadow">
            {/* Tabs Header */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Experiments
                </h2>
              </div>
              <div className="mt-4 flex space-x-1 px-6">
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
              {getFilteredExperiments().length > 0 ? (
                <RecentExperiments experiments={getFilteredExperiments()} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
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
            lastUpdated="2 hours ago"
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
