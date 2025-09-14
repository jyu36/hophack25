import React, { useState } from "react";
import { Button, Dropdown, Space, Typography, Modal, Collapse } from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Handle, Position, NodeProps } from "reactflow";
import { ResearchNode, NodeStatus } from "../../types/research";

const { Text, Paragraph } = Typography;

interface ExperimentNodeData {
  experiment: ResearchNode;
  onNodeClick?: (node: ResearchNode) => void;
  onNodeStatusChange?: (nodeId: number, status: string) => void;
}

const ExperimentNode: React.FC<NodeProps<ExperimentNodeData>> = ({ data }) => {
  const { experiment, onNodeClick, onNodeStatusChange } = data;
  const [isHovered, setIsHovered] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case "completed":
        return "#52c41a"; // Green
      case "planned":
        return "#faad14"; // Yellow
      case "postponed":
        return "#ff4d4f"; // Red
      default:
        return "#d9d9d9"; // Gray
    }
  };

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined />;
      case "planned":
        return <ClockCircleOutlined />;
      case "postponed":
        return <PauseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalVisible(true);
  };

  const handleStatusChange = (newStatus: string) => {
    if (onNodeStatusChange) {
      onNodeStatusChange(experiment.id, newStatus);
    }
  };

  const getStatusMenuItems = () => {
    const statuses: { key: string; label: string; icon: React.ReactNode }[] = [
      { key: "planned", label: "Planned", icon: <ClockCircleOutlined /> },
      { key: "completed", label: "Completed", icon: <CheckCircleOutlined /> },
      { key: "postponed", label: "Postponed", icon: <PauseCircleOutlined /> },
    ];

    return statuses.map((status) => ({
      key: status.key,
      label: (
        <Space>
          {status.icon}
          {status.label}
        </Space>
      ),
      onClick: () => handleStatusChange(status.key),
    }));
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="experiment-node"
      >
        {/* Input handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            background: "#555",
            width: 6,
            height: 6,
          }}
        />

        {/* Simple rectangle node */}
        <div
          style={{
            width: 280,
            height: experiment.id <= 3 ? 180 : 80, // Taller for nodes with images
            backgroundColor: "white",
            border: `2px solid ${getStatusColor(experiment.status)}`,
            borderRadius: 8,
            padding: 12,
            cursor: "pointer",
            boxShadow: isHovered
              ? "0 4px 12px rgba(0, 0, 0, 0.15)"
              : "0 2px 8px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Full title with status color */}
            <Text
              strong
              style={{
                color: getStatusColor(experiment.status),
                fontSize: 14,
                flex: 1,
                marginRight: 8,
                lineHeight: 1.2,
              }}
            >
              {experiment.title}
            </Text>

            {/* Plus button */}
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handlePlusClick}
              style={{
                color: getStatusColor(experiment.status),
                minWidth: 24,
                height: 24,
                flexShrink: 0,
              }}
            />
          </div>

          {/* Hardcoded images for experiments with IDs 1, 2, and 3 */}
          {experiment.id <= 3 && (
            <div
              style={{
                flex: 1,
                margin: "12px -12px -12px -12px",
                position: "relative",
                height: "100px",
                overflow: "hidden",
                borderTop: "1px solid #f0f0f0",
                backgroundColor: "#f5f5f5",
              }}
            >
              <img
                src={`/images/image_${
                  experiment.id === 1
                    ? "4.gif"
                    : experiment.id === 2
                    ? "2.png"
                    : "3.png"
                }`}
                alt={`Visualization for ${experiment.title}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "0 0 6px 6px",
                  imageRendering: experiment.id === 1 ? "auto" : "crisp-edges",
                }}
              />
            </div>
          )}

          {/* Status indicator row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#666",
              marginTop: "auto",
            }}
          >
            <span style={{ textTransform: "capitalize" }}>
              {experiment.status}
            </span>
            <span>{experiment.type}</span>
          </div>
        </div>

        {/* Output handles */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            background: "#555",
            width: 6,
            height: 6,
          }}
        />
      </div>

      {/* Modal for detailed view */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {getStatusIcon(experiment.status)}
            <span style={{ color: getStatusColor(experiment.status) }}>
              {experiment.title}
            </span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Dropdown
            key="status"
            menu={{ items: getStatusMenuItems() }}
            trigger={["click"]}
          >
            <Button>{getStatusIcon(experiment.status)} Change Status</Button>
          </Dropdown>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <div style={{ padding: "16px 0" }}>
          {/* Collapsible sections */}
          <Collapse
            size="small"
            items={[
              ...(experiment.description
                ? [
                    {
                      key: "description",
                      label: "Description",
                      children: (
                        <Paragraph style={{ margin: 0 }}>
                          {experiment.description}
                        </Paragraph>
                      ),
                    },
                  ]
                : []),
              ...(experiment.keywords && experiment.keywords.length > 0
                ? [
                    {
                      key: "keywords",
                      label: `Keywords (${experiment.keywords.length})`,
                      children: (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                          }}
                        >
                          {experiment.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: "#f0f0f0",
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />

          {/* Basic metadata - always visible */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
              padding: 12,
              backgroundColor: "#fafafa",
              borderRadius: 6,
            }}
          >
            <div>
              <Text strong>Type:</Text>
              <div>{experiment.type}</div>
            </div>
            <div>
              <Text strong>Status:</Text>
              <div style={{ color: getStatusColor(experiment.status) }}>
                {experiment.status}
              </div>
            </div>
            {experiment.created_at && (
              <div>
                <Text strong>Created:</Text>
                <div>
                  {new Date(experiment.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
            {experiment.aiGenerated && (
              <div>
                <Text strong>AI Generated:</Text>
                <div>Yes</div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExperimentNode;
