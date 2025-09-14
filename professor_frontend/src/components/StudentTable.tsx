import React, { useEffect, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { Tag, Typography, Card, message } from "antd";
import { Student } from "../mockData";
import api from "../utils/api";
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

  useEffect(() => {
    const fetchTomData = async () => {
      try {
        setLoading(true);
        // Get tasks from the last 10 days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        // First check if backend is running
        try {
          await api.get("/");
        } catch (err) {
          const error = err as AxiosError;
          message.error(
            "Backend server is not running. Please start the backend server with 'uvicorn app.main:app --reload'"
          );
          return;
        }

        // Fetch all experiments from the graph overview
        const response = await api.get("/graph/overview");
        const experiments: Experiment[] = response.data.nodes || [];

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
          lastMeetingNotes:
            "Last meeting notes will be fetched from API once implemented",
          discussionPoints:
            "Discussion points will be fetched from API once implemented",
        });
      } catch (err) {
        const error = err as AxiosError;
        console.error("Error fetching Tom's data:", error);
        // Show more specific error message
        if (error.code === "ERR_NETWORK") {
          message.error(
            "Cannot connect to backend server. Please make sure it's running with 'uvicorn app.main:app --reload'"
          );
        } else {
          message.error(`Failed to fetch recent experiments: ${error.message}`);
        }

        // Set fallback data for Tom
        setRealStudentData({
          completed: ["Backend connection error - please start the server"],
          planning: ["Run 'uvicorn app.main:app --reload' in backend folder"],
          lastMeetingNotes: "Backend server not running",
          discussionPoints: "Please start the backend server to see updates",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTomData();

    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchTomData, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const columns: ProColumns<Student>[] = [
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
        const completedTasks = record.isReal
          ? realStudentData.completed
          : record.completed;
        return (
          <>
            {completedTasks?.map((item, index) => (
              <Tag key={index} color="green">
                {item}
              </Tag>
            )) || null}
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
        const planningTasks = record.isReal
          ? realStudentData.planning
          : record.planning;
        return (
          <>
            {planningTasks?.map((item, index) => (
              <Tag key={index} color="blue">
                {item}
              </Tag>
            )) || null}
          </>
        );
      },
    },
    {
      title: "Last Meeting Notes",
      dataIndex: "lastMeetingNotes",
      key: "lastMeetingNotes",
      width: 300,
      render: (_, record) => {
        const notes = record.isReal
          ? realStudentData.lastMeetingNotes
          : record.lastMeetingNotes;
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
                onExpand: () => console.log("expanded"),
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
      render: (_, record) => {
        const points = record.isReal
          ? realStudentData.discussionPoints
          : record.discussionPoints;
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
                onExpand: () => console.log("expanded"),
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

  return (
    <ProTable<Student>
      columns={columns}
      dataSource={students}
      rowKey="id"
      search={false}
      dateFormatter="string"
      headerTitle="Student Progress Overview"
      scroll={{ x: 1500 }}
      pagination={{
        pageSize: 10,
      }}
      loading={loading}
    />
  );
};

export default StudentTable;
