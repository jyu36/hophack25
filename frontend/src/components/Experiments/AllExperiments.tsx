import React, { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Experiment } from "../../types/research";
import ExperimentCard from "../Dashboard/ExperimentCard";
import { NodeStatus } from "../../types/research";

interface AllExperimentsProps {
  experiments: Experiment[];
  onBack: () => void;
}

const AllExperiments: React.FC<AllExperimentsProps> = ({
  experiments,
  onBack,
}) => {
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

  // No internal sorting needed, as experiments are already filtered and sorted by the parent
  const displayedExperiments = useMemo(() => {
    let currentExperiments = [...experiments];

    if (sortBy === "date") {
      currentExperiments.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "status") {
      // Sort by status: completed first, then planned, then postponed
      currentExperiments.sort((a, b) => {
        const statusOrder: Record<NodeStatus, number> = {
          completed: 1,
          planned: 2,
          postponed: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    }
    return currentExperiments;
  }, [experiments, sortBy]);

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              All Past Experiments
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            View and manage all your past experiments
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Sort by:</span>
            <div className="flex bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setSortBy("date")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "date"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy("status")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === "status"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Status
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {experiments.length} experiments total
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {displayedExperiments.map((experiment) => (
            <ExperimentCard key={experiment.id} experiment={experiment} />
          ))}
        </div>

        {experiments.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No experiments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllExperiments;
