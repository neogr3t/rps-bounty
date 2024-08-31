import React from 'react';
import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card
    style={{
      background: "rgba(26, 41, 128, 0.7)",
      borderRadius: "15px",
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
      border: "none",
      backdropFilter: "blur(10px)",
    }}
  >
    <Statistic
      title={<span style={{ color: "#fff", fontSize: "16px" }}>{title}</span>}
      value={value}
      prefix={React.cloneElement(icon as React.ReactElement, { style: { color } })}
      valueStyle={{ color, fontSize: "24px" }}
    />
  </Card>
);

export default StatCard;