import React, { useState, useEffect } from "react";
import { Card, Button, Space, Alert, Spin } from "antd";
import { ReloadOutlined, DatabaseOutlined } from "@ant-design/icons";
import GraphPanel from "./GraphPanel";
import { ResearchNode } from "../../types/research";
import { Edge } from "../../types/api";
import { experimentService } from "../../services/experimentService";

/**
 * Demo component showcasing the GraphPanel with real API data
 */
const GraphDemo: React.FC = () => {
  const [experiments, setExperiments] = useState<ResearchNode[]>([]);
  const [relationships, setRelationships] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading graph data...");
      const overview = await experimentService.getGraphOverview();

      // Convert API nodes to ResearchNode format
      const researchNodes = overview.nodes.map((node) => ({
        ...node,
        type: node.type as any,
        status: node.status as any,
        level: 0,
        keywords: [],
        aiGenerated: false,
      }));

      setExperiments(researchNodes);
      setRelationships(overview.edges);

      console.log(
        `✅ Loaded ${researchNodes.length} experiments and ${overview.edges.length} relationships`
      );
    } catch (err) {
      console.error("❌ Error loading graph data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load graph data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNodeClick = (node: ResearchNode) => {
    console.log("Node clicked:", node);
    // You can implement node details modal here
  };

  const handleNodeStatusChange = async (nodeId: number, status: string) => {
    try {
      await experimentService.updateNode(nodeId, { status: status as any });
      console.log(`Updated node ${nodeId} status to ${status}`);
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error("Failed to update node status:", error);
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card style={{ width: 400 }}>
          <Alert
            message="Error Loading Graph"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={loadData}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DatabaseOutlined
              className="text-blue-600"
              style={{ fontSize: 24 }}
            />
            <h1 className="text-xl font-semibold text-gray-900">
              Research Graph Demo
            </h1>
          </div>

          <Space>
            <div className="text-sm text-gray-600">
              {experiments.length} experiments, {relationships.length}{" "}
              relationships
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={isLoading}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spin size="large" tip="Loading experiments..." />
          </div>
        ) : (
          <GraphPanel
            experiments={experiments}
            relationships={relationships}
            onNodeClick={handleNodeClick}
            onNodeStatusChange={handleNodeStatusChange}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default GraphDemo;
