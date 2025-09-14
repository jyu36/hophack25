import React, { useState, useEffect } from "react";
import { Typography, Input, Button, Card, Space, message } from "antd";
import {
  getNotes,
  updateNotes,
  getDiscussion,
  updateDiscussion,
  getFeedback,
} from "../../utils/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Communication: React.FC = () => {
  const [lastMeetingNotes, setLastMeetingNotes] = useState<string>("");
  const [nextMeetingPlan, setNextMeetingPlan] = useState<string>("");
  const [professorFeedback, setProfessorFeedback] = useState<string>("");
  const [loading, setLoading] = useState<{
    notes: boolean;
    plan: boolean;
  }>({ notes: false, plan: false });

  useEffect(() => {
    fetchData();
    setupFeedbackSSE();
  }, []);

  const setupFeedbackSSE = () => {
    const feedbackEventSource = new EventSource(
      "http://localhost:8000/feedback/updates"
    );

    feedbackEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProfessorFeedback(data.professor_feedback || "No feedback yet");
    };

    feedbackEventSource.onerror = (error) => {
      console.error("Feedback SSE error:", error);
      feedbackEventSource.close();
      setTimeout(setupFeedbackSSE, 5000); // Try to reconnect after 5 seconds
    };

    return () => {
      feedbackEventSource.close();
    };
  };

  const fetchData = async () => {
    try {
      const [notesRes, discussionRes, feedbackRes] = await Promise.all([
        getNotes(),
        getDiscussion(),
        getFeedback(),
      ]);
      setLastMeetingNotes(notesRes.last_meeting_notes || "");
      setNextMeetingPlan(discussionRes.discussion_points || "");
      setProfessorFeedback(feedbackRes.professor_feedback || "No feedback yet");
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
    } catch (error) {
      console.error("Error updating:", error);
      message.error("Failed to update");
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto"
      style={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="mb-8 flex-shrink-0">
        <Title level={2}>Communication Hub</Title>
        <Text className="text-lg">You are part of Professor Jiaqi's lab</Text>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingRight: "8px" }}>
        <Space direction="vertical" size="large" className="w-full">
          <Card title="Professor's Feedback" className="w-full">
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line min-h-[100px] max-h-[200px] overflow-y-auto">
              {professorFeedback}
            </div>
          </Card>

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
              <Button
                onClick={() => handleSubmit("plan")}
                loading={loading.plan}
              >
                Modify
              </Button>
            </div>
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default Communication;
