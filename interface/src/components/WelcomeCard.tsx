import React from 'react';
import { Col, Card, Typography, Space } from 'antd';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { RocketOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const WelcomeCard: React.FC = () => {
  return (
    <Col xs={24} sm={20} md={16} lg={12}>
      <Card
        style={{
          background: "linear-gradient(135deg, rgba(26, 41, 128, 0.8), rgba(0, 0, 0, 0.9))",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)",
          border: "1px solid rgba(0, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
          padding: "50px",
          textAlign: "center",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <RocketOutlined style={{ fontSize: '48px', color: '#00ffff' }} />
          <Title level={2} style={{ 
            color: "#fff", 
            marginBottom: "20px",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)"
          }}>
            Welcome to Neosmic RPS!
          </Title>
          <Paragraph style={{ 
            color: "#00ffff", 
            fontSize: "18px", 
            marginBottom: "30px",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)"
          }}>
            Connect your wallet to start playing Rock Paper Scissors against the AI.
          </Paragraph>
          <WalletSelector />
        </Space>
      </Card>
    </Col>
  );
};

export default WelcomeCard;