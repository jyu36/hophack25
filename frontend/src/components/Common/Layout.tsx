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
import Profile from "./Profile";

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
        style={{
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 100,
        }}
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
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: 0,
            background: "white",
            position: "fixed",
            width: `calc(100% - ${collapsed ? 80 : 200}px)`,
            zIndex: 99,
            top: 0,
          }}
          className="border-b flex items-center justify-between"
        >
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "p-4 text-lg",
              onClick: () => setCollapsed(!collapsed),
            }
          )}
          <Profile />
        </Header>
        <Content style={{ marginTop: 64, padding: 0, overflow: "visible" }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default MainLayout;
