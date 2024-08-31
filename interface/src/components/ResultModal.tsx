import React from 'react';
import { Modal, Space, Card, Statistic, Button } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { ModalContent } from '../types';

interface ResultModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  modalContent: ModalContent | null;
}

const ResultModal: React.FC<ResultModalProps> = ({ isModalVisible, setIsModalVisible, modalContent }) => {
  return (
    <Modal
      visible={isModalVisible}
      onOk={() => setIsModalVisible(false)}
      onCancel={() => setIsModalVisible(false)}
      footer={null}
      bodyStyle={{ 
        background: "linear-gradient(135deg, rgba(26, 41, 128, 0.9), rgba(0, 0, 0, 0.9))",
        borderRadius: "20px",
        boxShadow: "0 0 30px rgba(0, 255, 255, 0.3)",
        border: "1px solid rgba(0, 255, 255, 0.2)",
        padding: "0",
      }}
      width={400}
      centered
    >
      {modalContent && (
        <div style={{ position: "relative", padding: "30px", textAlign: "center" }}>
          <h2 style={{ color: "#00ffff", marginBottom: "30px", textShadow: "0 0 10px rgba(0, 255, 255, 0.5)" }}>
            Game Result
          </h2>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                border: "1px solid rgba(0, 255, 255, 0.3)",
              }}
            >
              <Statistic
                title={<span style={{ color: "#fff" }}>Your Move</span>}
                value={modalContent.playerMove}
                valueStyle={{ color: "#00ffff", fontSize: "24px" }}
                prefix={<UserOutlined style={{ color: "#00ffff" }} />}
              />
            </Card>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                border: "1px solid rgba(255, 69, 0, 0.3)",
              }}
            >
              <Statistic
                title={<span style={{ color: "#fff" }}>AI's Move</span>}
                value={modalContent.aiMove}
                valueStyle={{ color: "#ff4500", fontSize: "24px" }}
                prefix={<RobotOutlined style={{ color: "#ff4500" }} />}
              />
            </Card>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                border: "1px solid rgba(0, 206, 209, 0.3)",
              }}
            >
              <Statistic
                title={<span style={{ color: "#fff" }}>Result</span>}
                value={modalContent.result}
                valueStyle={{ color: "#00ced1", fontSize: "24px", fontWeight: "bold" }}
              />
            </Card>
          </Space>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(false)}
            style={{ 
              marginTop: "30px",
              background: "linear-gradient(135deg, #00ffff, #00bfff)",
              borderColor: "#00ffff",
              color: "#fff",
              borderRadius: "20px",
              fontSize: "18px",
              height: "40px",
              width: "120px",
              boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
            }}
          >
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ResultModal;