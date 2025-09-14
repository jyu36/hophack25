import React, { useState, useEffect } from "react";
import { Typography, Input, Button, Card, Space, message } from "antd";
import {
  getNotes,
  updateNotes,
  getDiscussion,
  updateDiscussion,
} from "../../utils/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Communication: React.FC = () => {
  const [lastMeetingNotes, setLastMeetingNotes] = useState<string>("");
  const [nextMeetingPlan, setNextMeetingPlan] = useState<string>("");
  const [loading, setLoading] = useState<{
    notes: boolean;
    plan: boolean;
  }>({ notes: false, plan: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, discussionRes] = await Promise.all([
        getNotes(),
        getDiscussion(),
      ]);
      setLastMeetingNotes(notesRes.last_meeting_notes || "");
      setNextMeetingPlan(discussionRes.discussion_points || "");
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data");
    }
  };

  const handleSubmit = async (type: "notes" | "plan") => {
    try {
      setLoading((prev) => ({ ...prev, [type]: true }));

      if (type === "notes") {
        await updateNotes(lastMeetingNotes);
        message.success("Last meeting notes updated");
      } else {
        await updateDiscussion(nextMeetingPlan);
        message.success("Next meeting plan updated");
      }

      // Refresh data after update
      await fetchData();
    } catch (error) {
      console.error("Error updating:", error);
      message.error(
        `Failed to update ${
          type === "notes" ? "meeting notes" : "meeting plan"
        }`
      );
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
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
              loading={loading.notes}
            >
              Submit
            </Button>
            <Button
              onClick={() => handleSubmit("notes")}
              loading={loading.notes}
            >
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
              loading={loading.plan}
            >
              Submit
            </Button>
            <Button onClick={() => handleSubmit("plan")} loading={loading.plan}>
              Modify
            </Button>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default Communication;
