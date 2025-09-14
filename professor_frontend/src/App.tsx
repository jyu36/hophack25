import React from "react";
import "./App.css";
import { Layout, ConfigProvider } from "antd";
import Summary from "./components/Summary/index";
import StudentTable from "./components/StudentTable";
import { mockStudents } from "./mockData";

const { Header, Content } = Layout;

function App() {
  return (
    <ConfigProvider>
      <Layout className="min-h-screen">
        <Header className="bg-white shadow">
          <div className="max-w-7xl mx-auto h-full flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Professor Jiaqi's Dashboard
            </h1>
          </div>
        </Header>
        <Content className="bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Summary students={mockStudents} />
            <StudentTable students={mockStudents} />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
