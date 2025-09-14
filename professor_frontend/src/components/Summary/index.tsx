import React from "react";
import { Card, Typography, Space, Tag } from "antd";
import { Student } from "../../mockData";

const { Title, Text } = Typography;

interface SummaryProps {
  students: Student[];
}

const Summary: React.FC<SummaryProps> = ({ students }) => {
  const studentsWithUpdates = students.filter((student) => student.hasUpdates);

  return (
    <Card className="mb-6">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Title level={4}>
          {studentsWithUpdates.length} students have updates on their
          experiments this week:
        </Title>
        <div>
          <Text>Students with updates: </Text>
          <Space size={[0, 8]} wrap>
            {studentsWithUpdates.map((student) => (
              <Tag key={student.id} color="blue">
                {student.name}
              </Tag>
            ))}
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default Summary;
