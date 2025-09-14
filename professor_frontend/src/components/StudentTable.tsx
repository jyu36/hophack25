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
} from "antd";
import { PlusOutlined, MinusOutlined, SendOutlined } from "@ant-design/icons";
import { Student } from "../mockData";
import api, { getFeedback, updateFeedback } from "../utils/api";
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
  }, []);

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
            <Card title="Summary" size="small">
              <div style={{ minHeight: "200px", padding: "8px" }}>
                <Typography.Text type="secondary">
                  Summary will be loaded from API endpoint (to be implemented)
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  This section will contain student progress summary, key
                  achievements, and recommendations.
                </Typography.Text>
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
  );
};

export default StudentTable;
