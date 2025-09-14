import React, { useEffect, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { Tag, Typography, Card, message } from "antd";
import { Student } from "../../mockData";
import api from "../../utils/api";

const { Paragraph } = Typography;

interface RealStudentData {
  completed: string[];
  planning: string[];
  lastMeetingNotes: string;
  discussionPoints: string;
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
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const response = await api.get("/api/experiments", {
          params: {
            student: "tom_wang",
            after: tenDaysAgo.toISOString(),
          },
        });

        const tasksData = response.data?.experiments || response.data || [];

        const completed = Array.isArray(tasksData)
          ? tasksData
              .filter((task: any) => task?.status === "completed" && task?.name)
              .map((task: any) => task.name)
          : [];

        const planning = Array.isArray(tasksData)
          ? tasksData
              .filter((task: any) => task?.status === "planning" && task?.name)
              .map((task: any) => task.name)
          : [];

        setRealStudentData({
          completed,
          planning,
          lastMeetingNotes:
            "Last meeting notes will be fetched from API once implemented",
          discussionPoints:
            "Discussion points will be fetched from API once implemented",
        });
      } catch (error) {
        console.error("Error fetching Tom's data:", error);
        message.error("Failed to fetch Tom's recent updates");
        setRealStudentData({
          completed: ["Error loading recent completed tasks"],
          planning: ["Error loading planned tasks"],
          lastMeetingNotes: "Error loading meeting notes",
          discussionPoints: "Error loading discussion points",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTomData();
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
          <Card size="small" className="max-w-full">
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: true,
                symbol: "more",
              }}
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
          <Card size="small" className="max-w-full">
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: true,
                symbol: "more",
              }}
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
