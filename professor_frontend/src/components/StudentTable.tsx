import React, { useEffect, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  Tag,
  Typography,
  Card,
  Button,
  message,
  Input,
  Row,
  Col,
  Space,
  Modal,
  Spin,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  SendOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Student } from "../mockData";
import api, {
  getFeedback,
  updateFeedback,
  getWeeklySummary,
  SummaryResponse,
} from "../utils/api";
import axios, { AxiosError } from "axios";

const { Paragraph } = Typography;

interface RealStudentData {
  completed: string[];
  planning: string[];
  lastMeetingNotes: string;
  discussionPoints: string;
}

interface Experiment {
  id: number;
  title: string;
  description: string;
  status: "planned" | "completed" | "postponed";
  created_at: string;
  updated_at: string;
}

const StudentTable: React.FC<{ students: Student[] }> = ({ students }) => {
  const [realStudentData, setRealStudentData] = useState<RealStudentData>({
    completed: [],
    planning: [],
    lastMeetingNotes: "",
    discussionPoints: "",
  });
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string>("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<SummaryResponse | null>(
    null
  );
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fetchTomData = async () => {
    try {
      setLoading(true);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      // Fetch all data in parallel
      const [graphResponse, notesResponse, discussionResponse] =
        await Promise.all([
          api.get("/graph/overview"),
          api.get("/notes"),
          api.get("/discussion"),
        ]);

      const experiments: Experiment[] = graphResponse.data.nodes || [];

      // Filter experiments by date and status
      const recentExperiments = experiments.filter((exp) => {
        const expDate = new Date(exp.updated_at);
        return expDate >= tenDaysAgo;
      });

      const completed = recentExperiments
        .filter((exp) => exp.status === "completed")
        .map((exp) => exp.title);

      const planning = recentExperiments
        .filter((exp) => exp.status === "planned")
        .map((exp) => exp.title);

      setRealStudentData({
        completed,
        planning,
        lastMeetingNotes: notesResponse.data.last_meeting_notes || "",
        discussionPoints: discussionResponse.data.discussion_points || "",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch data from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTomData();
    loadFeedback();
    loadWeeklySummary();
  }, []);

  const loadWeeklySummary = async () => {
    try {
      setIsLoadingSummary(true);
      const summaryData = await getWeeklySummary();
      setWeeklySummary(summaryData);
    } catch (error) {
      console.error("Error loading weekly summary:", error);
      message.error("Failed to load weekly summary");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const feedbackData = await getFeedback();
      setFeedback(feedbackData.professor_feedback || "");
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  const toggleExpand = (studentId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(studentId)) {
      newExpandedRows.delete(studentId);
    } else {
      newExpandedRows.add(studentId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      message.warning("Please enter feedback before sending");
      return;
    }

    try {
      setSendingFeedback(true);
      await updateFeedback(feedback);
      message.success("Feedback sent successfully!");
    } catch (error) {
      console.error("Error sending feedback:", error);
      message.error("Failed to send feedback");
    } finally {
      setSendingFeedback(false);
    }
  };

  const columns: ProColumns<Student>[] = [
    {
      title: "",
      dataIndex: "expand",
      width: 48,
      render: (_, record) => (
        <Button
          type="text"
          icon={
            expandedRows.has(record.id) ? <MinusOutlined /> : <PlusOutlined />
          }
          onClick={() => toggleExpand(record.id)}
        />
      ),
    },
    {
      title: "Student Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 150,
    },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      width: 300,
      render: (_, record) => {
        const tasks = record.isReal
          ? realStudentData.completed
          : record.completed;
        return (
          <>
            {tasks?.map((item, index) => (
              <Tag key={index} color="green">
                {item}
              </Tag>
            ))}
          </>
        );
      },
    },
    {
      title: "Planning",
      dataIndex: "planning",
      key: "planning",
      width: 300,
      render: (_, record) => {
        const tasks = record.isReal
          ? realStudentData.planning
          : record.planning;
        return (
          <>
            {tasks?.map((item, index) => (
              <Tag key={index} color="blue">
                {item}
              </Tag>
            ))}
          </>
        );
      },
    },
    {
      title: "Last Meeting Notes",
      dataIndex: "lastMeetingNotes",
      key: "lastMeetingNotes",
      width: 300,
      render: (text, record) => {
        const notes = record.isReal ? realStudentData.lastMeetingNotes : text;
        return (
          <Card
            size="small"
            className="max-w-full"
            bodyStyle={{
              whiteSpace: "pre-line",
              padding: "12px",
              maxHeight: "500px",
              overflow: "auto",
            }}
          >
            <Paragraph
              ellipsis={{
                rows: 3,
                expandable: true,
                symbol: "Click to expand",
              }}
              style={{ marginBottom: 0 }}
            >
              {notes || "No notes available"}
            </Paragraph>
          </Card>
        );
      },
    },
    {
      title: "Discussion Points",
      dataIndex: "discussionPoints",
      key: "discussionPoints",
      width: 300,
      render: (text, record) => {
        const points = record.isReal ? realStudentData.discussionPoints : text;
        return (
          <Card
            size="small"
            className="max-w-full"
            bodyStyle={{
              whiteSpace: "pre-line",
              padding: "12px",
              maxHeight: "500px",
              overflow: "auto",
            }}
          >
            <Paragraph
              ellipsis={{
                rows: 3,
                expandable: true,
                symbol: "Click to expand",
              }}
              style={{ marginBottom: 0 }}
            >
              {points || "No discussion points available"}
            </Paragraph>
          </Card>
        );
      },
    },
  ];

  const expandedRowRender = (record: Student) => {
    return (
      <div style={{ padding: "16px", backgroundColor: "#fafafa" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title="Weekly Summary"
              size="small"
              extra={
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  onClick={() => setIsSummaryModalOpen(true)}
                  disabled={!weeklySummary}
                >
                  View Full
                </Button>
              }
            >
              <div style={{ minHeight: "200px", padding: "8px" }}>
                {isLoadingSummary ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spin size="small" />
                    <div style={{ marginTop: "8px" }}>
                      <Typography.Text type="secondary">
                        Loading weekly summary...
                      </Typography.Text>
                    </div>
                  </div>
                ) : weeklySummary ? (
                  <div>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: "12px" }}
                    >
                      Last updated:{" "}
                      {new Date(weeklySummary.generated_at).toLocaleString()}
                      {weeklySummary.cache_hit && " (cached)"}
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text>
                      {weeklySummary.summary.length > 300
                        ? `${weeklySummary.summary.substring(0, 300)}...`
                        : weeklySummary.summary}
                    </Typography.Text>
                    {weeklySummary.summary.length > 300 && (
                      <div style={{ marginTop: "8px" }}>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setIsSummaryModalOpen(true)}
                        >
                          Read more...
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Typography.Text type="secondary">
                    Failed to load weekly summary. Please try again.
                  </Typography.Text>
                )}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Professor Feedback" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input.TextArea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your feedback for the student..."
                  rows={6}
                  style={{ marginBottom: "8px" }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendFeedback}
                  loading={sendingFeedback}
                  style={{ width: "100%" }}
                >
                  Send Feedback
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <>
      <ProTable<Student>
        columns={columns}
        dataSource={students}
        rowKey="id"
        search={false}
        options={false}
        dateFormatter="string"
        headerTitle="Student Progress Overview"
        scroll={{ x: 1500 }}
        pagination={false}
        loading={loading}
        expandable={{
          expandedRowKeys: Array.from(expandedRows),
          onExpandedRowsChange: (expandedKeys) => {
            setExpandedRows(new Set(expandedKeys as string[]));
          },
          expandedRowRender,
          expandRowByClick: false,
          expandIcon: () => null, // Hide the default expand icon
        }}
      />

      {/* Weekly Summary Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <FileTextOutlined
              style={{ marginRight: "8px", color: "#1890ff" }}
            />
            Weekly Research Summary
          </div>
        }
        open={isSummaryModalOpen}
        onCancel={() => setIsSummaryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsSummaryModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="refresh"
            type="primary"
            onClick={loadWeeklySummary}
            loading={isLoadingSummary}
          >
            Refresh
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {isLoadingSummary ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" />
              <div style={{ marginTop: "16px" }}>
                <Typography.Text>Loading weekly summary...</Typography.Text>
              </div>
            </div>
          ) : weeklySummary ? (
            <div>
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "6px",
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                  <strong>Generated:</strong>{" "}
                  {new Date(weeklySummary.generated_at).toLocaleString()}
                  {weeklySummary.cache_hit && " (served from cache)"}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                  <strong>Data:</strong> {weeklySummary.node_count} experiments,{" "}
                  {weeklySummary.edge_count} relationships
                </Typography.Text>
              </div>
              <Typography.Paragraph
                style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
              >
                {weeklySummary.summary}
              </Typography.Paragraph>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Typography.Text type="secondary">
                Failed to load weekly summary. Please try refreshing.
              </Typography.Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default StudentTable;
