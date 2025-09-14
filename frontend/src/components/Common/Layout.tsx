import React, { useState } from "react";
import { Layout as AntLayout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = AntLayout;

interface MainLayoutProps {
  children: React.ReactNode;
}

type MenuItem = Required<MenuProps>["items"][number];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/research",
      icon: <ProjectOutlined />,
      label: "Research Map",
    },
    {
      key: "/communication",
      icon: <MessageOutlined />,
      label: "Communication",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    navigate(info.key);
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        className="border-r"
      >
        <div className="p-4 h-16 flex items-center justify-between">
          <h1
            className={`text-lg font-bold transition-opacity duration-200 ${
              collapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            Prof. Jiaqi's Lab
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{ padding: 0, background: "white" }}
          className="border-b flex items-center"
        >
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "p-4 text-lg",
              onClick: () => setCollapsed(!collapsed),
            }
          )}
        </Header>
        <Content className="m-6">{children}</Content>
      </AntLayout>
    </AntLayout>
  );
};

export default MainLayout;
