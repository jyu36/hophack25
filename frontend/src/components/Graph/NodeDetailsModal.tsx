import React, { useState } from "react";
import { ExternalLink, Book, GitBranch, Loader } from "lucide-react";
import Modal from "../Common/Modal";
import Button from "../Common/Button";
import ResizableHorizontalDivider from "../Common/ResizableHorizontalDivider";
import {
  ResearchNode,
  RelatedPaper,
  NodeDetails,
  NodeStatus,
} from "../../types/research";

interface NodeDetailsModalProps {
  node: ResearchNode;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (nodeId: string, status: NodeStatus) => void;
  onCreateBranch: (nodeId: string) => void;
  nodeDetails: NodeDetails;
}

const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  node,
  isOpen,
  onClose,
  onStatusChange,
  onCreateBranch,
  nodeDetails,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "papers" | "solutions">(
    "info"
  );
  const [topSectionHeight, setTopSectionHeight] = useState(200); // Default height for the top section

  const statusColors = {
    completed: "bg-green-100 text-green-800 border-green-200",
    planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
    postponed: "bg-red-100 text-red-800 border-red-200",
  };

  const renderPaperList = (papers: RelatedPaper[]) => (
    <div className="space-y-4">
      {papers.map((paper) => (
        <div key={paper.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{paper.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {paper.authors.join(", ")} • {paper.year}
              </p>
            </div>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {paper.abstract}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Citations: {paper.citations}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSolutionsList = (solutions: ResearchNode[]) => (
    <div className="space-y-4">
      {solutions.map((solution) => (
        <div
          key={solution.id}
          className={`border rounded-lg p-4 ${statusColors[solution.status]}`}
        >
          <h4 className="font-medium text-gray-900">{solution.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{solution.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {solution.keywords.map((keyword) => (
              <span
                key={keyword}
                className="text-xs bg-white bg-opacity-50 rounded-full px-2 py-1"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={node.title} size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 border-b-2 text-sm font-medium ${
                activeTab === "info"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("info")}
            >
              Information
            </button>
            <button
              className={`py-2 px-4 border-b-2 text-sm font-medium ${
                activeTab === "papers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("papers")}
            >
              Related Papers
            </button>
            <button
              className={`py-2 px-4 border-b-2 text-sm font-medium ${
                activeTab === "solutions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("solutions")}
            >
              AI Solutions
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Top Section with fixed height */}
              <div
                style={{ height: topSectionHeight }}
                className="overflow-y-auto"
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Description
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {node.description}
                  </p>
                </div>

                {node.motivation && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Motivation
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {node.motivation}
                    </p>
                  </div>
                )}
              </div>

              {/* Resizable Divider */}
              <ResizableHorizontalDivider
                onResize={setTopSectionHeight}
                minHeight={100}
                maxHeight={400}
              />

              {/* Bottom Section */}
              <div className="space-y-4">
                {node.expectations && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Expected Outcomes
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {node.expectations}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Keywords
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {node.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant={
                        node.status === "completed" ? "success" : "secondary"
                      }
                      onClick={() => onStatusChange(node.id, "completed")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        node.status === "planned" ? "primary" : "secondary"
                      }
                      onClick={() => onStatusChange(node.id, "planned")}
                    >
                      Keep Planned
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        node.status === "postponed" ? "danger" : "secondary"
                      }
                      onClick={() => onStatusChange(node.id, "postponed")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "papers" && (
            <div>
              {nodeDetails.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : nodeDetails.papers.length > 0 ? (
                renderPaperList(nodeDetails.papers)
              ) : (
                <div className="text-center py-12">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No related papers found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "solutions" && (
            <div>
              {nodeDetails.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : nodeDetails.solutions.length > 0 ? (
                renderSolutionsList(nodeDetails.solutions)
              ) : (
                <div className="text-center py-12">
                  <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No AI solutions available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onCreateBranch(node.id)}>
            Create New Branch
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NodeDetailsModal;
