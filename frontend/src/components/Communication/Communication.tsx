import React, { useState, useEffect } from "react";
import { Typography, Input, Button, Card, Space, message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import api from "../../utils/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Communication: React.FC = () => {
  const [lastMeetingNotes, setLastMeetingNotes] = useState<string>("");
  const [nextMeetingPlan, setNextMeetingPlan] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, discussionRes] = await Promise.all([
        api.get<{ last_meeting_notes: string }>("/notes"),
        api.get<{ discussion_points: string }>("/discussion"),
      ]);
      setLastMeetingNotes(notesRes.data.last_meeting_notes || "");
      setNextMeetingPlan(discussionRes.data.discussion_points || "");
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data");
    }
  };

  const handleSubmit = async (type: "notes" | "plan") => {
    setLoading(true);
    try {
      if (type === "notes") {
        await api.post("/notes", null, {
          params: { last_meeting_notes: lastMeetingNotes },
        });
        message.success("Last meeting notes updated");
      } else {
        await api.post("/discussion", null, {
          params: { discussion_points: nextMeetingPlan },
        });
        message.success("Next meeting plan updated");
      }
    } catch (error) {
      console.error("Error updating:", error);
      message.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Title level={2}>Communication Hub</Title>
        <Text className="text-lg">You are part of Professor Jiaqi's lab</Text>
      </div>

      <Space direction="vertical" size="large" className="w-full">
        <Card title="Last Meeting Notes" className="w-full">
          <TextArea
            value={lastMeetingNotes}
            onChange={(e) => setLastMeetingNotes(e.target.value)}
            rows={6}
            placeholder="Enter last meeting notes..."
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button
              type="primary"
              onClick={() => handleSubmit("notes")}
              loading={loading}
            >
              Submit
            </Button>
            <Button onClick={() => handleSubmit("notes")} loading={loading}>
              Modify
            </Button>
          </div>
        </Card>

        <Card title="Next Meeting Plan" className="w-full">
          <TextArea
            value={nextMeetingPlan}
            onChange={(e) => setNextMeetingPlan(e.target.value)}
            rows={6}
            placeholder="Enter next meeting plan..."
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button
              type="primary"
              onClick={() => handleSubmit("plan")}
              loading={loading}
            >
              Submit
            </Button>
            <Button onClick={() => handleSubmit("plan")} loading={loading}>
              Modify
            </Button>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default Communication;
