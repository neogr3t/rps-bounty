import React from 'react';
import { Card, Button, Space, Row, Col } from 'antd';
import { moves } from '../constants';

interface GameBoardProps {
  gameInitialized: boolean;
  initializeGame: () => void;
  selectedMove: number | null;
  setSelectedMove: (move: number) => void;
  playGame: (move: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameInitialized,
  initializeGame,
  selectedMove,
  setSelectedMove,
  playGame,
}) => {
  const renderMoveButton = (move: string, index: number) => (
    <Button
      onClick={() => setSelectedMove(index)}
      type={selectedMove === index ? "primary" : "default"}
      size="large"
      style={{
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        fontSize: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: selectedMove === index 
          ? "linear-gradient(135deg, #00ffff, #00bfff)" 
          : "linear-gradient(135deg, #1a2980, #26d0ce)",
        color: "#fff",
        border: "none",
        boxShadow: selectedMove === index 
          ? "0 0 20px #00ffff" 
          : "0 10px 20px rgba(0, 0, 0, 0.2)",
        transition: "all 0.3s ease",
        textTransform: "uppercase",
        fontWeight: "bold",
      }}
    >
      {move}
    </Button>
  );

  return (
    <Card
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)", 
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(10px)",
        padding: "30px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {!gameInitialized ? (
        <Button
          onClick={initializeGame}
          type="primary"
          size="large"
          style={{ 
            width: "100%",
            height: "60px",
            background: "linear-gradient(135deg, #00ffff, #00bfff)",
            border: "none",
            fontSize: "20px",
            fontWeight: "bold",
            borderRadius: "30px",
          }}
        >
          Initialize Game
        </Button>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <h2 style={{ color: "#fff", textAlign: "center", margin: "0 0 20px", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
            Choose your move:
          </h2>
          <Row justify="center" gutter={[32, 32]}>
            {moves.map((move, index) => (
              <Col key={move}>
                {renderMoveButton(move, index)}
              </Col>
            ))}
          </Row>
          <Button
            onClick={() => selectedMove !== null && playGame(selectedMove)}
            type="primary"
            size="large"
            disabled={selectedMove === null}
            style={{ 
              width: "100%",
              height: "60px",
              marginTop: "30px",
              background: "linear-gradient(135deg, #00ffff, #00bfff)",
              border: "none",
              fontSize: "24px",
              fontWeight: "bold",
              borderRadius: "30px",
            }}
          >
            Play!
          </Button>
        </Space>
      )}
    </Card>
  );
};

export default GameBoard;