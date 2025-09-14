import React from "react";
import { Avatar, Dropdown, Button } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

const Profile: React.FC = () => {
  const handleLogout = () => {
    // Add logout logic here
    console.log("Logout clicked");
    // You can add actual logout functionality later
  };

  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "Log Out",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="flex items-center space-x-3 mr-4">
      <span className="text-gray-700 font-medium">Tom Wang</span>
      <Dropdown menu={{ items }} placement="bottomRight" arrow>
        <Button type="text" className="p-0 h-auto">
          <Avatar
            size={40}
            src="https://api.dicebear.com/7.x/cat/svg?seed=TomWang&backgroundColor=ffd5dc,ffdfbf,d1d4f9,c0aede,ffd5dc"
            icon={<UserOutlined />}
            className="border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
          />
        </Button>
      </Dropdown>
    </div>
  );
};

export default Profile;
