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

  const fetchExperiments = async () => {
    try {
      const response = await api.get("/graph/overview");
      const experiments: Experiment[] = response.data.nodes || [];

      // Get tasks from the last 10 days
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

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

      return { completed, planning };
    } catch (error) {
      console.error("Error fetching experiments:", error);
      return { completed: [], planning: [] };
    }
  };

  useEffect(() => {
    const setupSSE = () => {
      const notesEventSource = new EventSource(
        "http://localhost:8000/notes/updates"
      );
      const discussionEventSource = new EventSource(
        "http://localhost:8000/discussion/updates"
      );

      notesEventSource.onmessage = async (event) => {
        const notesData = JSON.parse(event.data);
        const experimentsData = await fetchExperiments();

        setRealStudentData((prev) => ({
          ...prev,
          ...experimentsData,
          lastMeetingNotes:
            notesData.last_meeting_notes || "No meeting notes available",
        }));
      };

      discussionEventSource.onmessage = (event) => {
        const discussionData = JSON.parse(event.data);
        setRealStudentData((prev) => ({
          ...prev,
          discussionPoints:
            discussionData.discussion_points ||
            "No discussion points available",
        }));
      };

      notesEventSource.onerror = (error) => {
        console.error("Notes SSE error:", error);
        notesEventSource.close();
        setTimeout(setupSSE, 5000); // Try to reconnect after 5 seconds
      };

      discussionEventSource.onerror = (error) => {
        console.error("Discussion SSE error:", error);
        discussionEventSource.close();
        setTimeout(setupSSE, 5000); // Try to reconnect after 5 seconds
      };

      return () => {
        notesEventSource.close();
        discussionEventSource.close();
      };
    };

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [notesResponse, discussionResponse] = await Promise.all([
          api.get("/notes"),
          api.get("/discussion"),
        ]);

        const experimentsData = await fetchExperiments();

        setRealStudentData({
          ...experimentsData,
          lastMeetingNotes:
            notesResponse.data.last_meeting_notes ||
            "No meeting notes available",
          discussionPoints:
            discussionResponse.data.discussion_points ||
            "No discussion points available",
        });
      } catch (error) {
        console.error("Error fetching initial data:", error);
        message.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    const cleanup = setupSSE();

    return () => {
      cleanup();
    };
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
