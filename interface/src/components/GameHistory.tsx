import React from 'react';
import { Row, Col, Card, Progress, List, Avatar, Divider } from 'antd';
import { UserOutlined, RobotOutlined, BarChartOutlined, TrophyOutlined } from '@ant-design/icons';
import StatCard from './StatCard';
import { GameState, GameHistoryItem } from '../types';
import rcsImage from '../images/rcsimage.png';

interface GameHistoryProps {
  gameState: GameState;
  gameHistory: GameHistoryItem[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ gameState, gameHistory }) => {
  const calculateWinPercentage = (wins: number, total: number): string => {
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <StatCard title="Player Score" value={gameState.playerScore} icon={<UserOutlined />} color="#ffd700" />
        </Col>
        <Col span={12}>
          <StatCard title="AI Score" value={gameState.aiScore} icon={<RobotOutlined />} color="#ff4500" />
        </Col>
        <Col span={12}>
          <StatCard title="Draws" value={gameState.draws} icon={<BarChartOutlined />} color="#00ced1" />
        </Col>
        <Col span={12}>
          <StatCard title="Games Played" value={gameState.gamesPlayed} icon={<TrophyOutlined />} color="#9370db" />
        </Col>
      </Row>
      <Card
        style={{
          background: "rgba(26, 41, 128, 0.7)",
          borderRadius: "15px",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
          border: "none",
          backdropFilter: "blur(10px)",
          marginTop: "16px",
        }}
      >
        <Progress
          percent={Number(calculateWinPercentage(gameState.playerScore, gameState.gamesPlayed))}
          status="active"
          strokeColor={{
            "0%": "#00ffff",
            "100%": "#00bfff",
          }}
          trailColor="rgba(255, 255, 255, 0.2)"
        />
        <div style={{ color: "#fff", textAlign: "center", marginTop: "10px", fontSize: "16px" }}>
          Win Rate: {calculateWinPercentage(gameState.playerScore, gameState.gamesPlayed)}%
        </div>
      </Card>
      <Card
        title={<h4 style={{ color: "#fff", margin: 0 }}>Game History</h4>}
        style={{
          background: "rgba(26, 41, 128, 0.7)",
          borderRadius: "15px",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
          border: "none",
          backdropFilter: "blur(10px)",
          marginTop: "16px",
        }}
      >
        {gameHistory.length > 0 ? (
          <>
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={rcsImage} style={{ backgroundColor: "#00ffff" }} />}
                title={<span style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>Last Game</span>}
                description={
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                    You: {gameHistory[0].playerMove} | AI: {gameHistory[0].aiMove} | Result: {gameHistory[0].result}
                  </span>
                }
              />
            </List.Item>
            <Divider style={{ background: "rgba(255,255,255,0.2)" }} />
            <List
              itemLayout="horizontal"
              dataSource={gameHistory.slice(1)}
              renderItem={(game, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={rcsImage} style={{ backgroundColor: "#00ffff" }} />}
                    title={<span style={{ color: "#fff", fontSize: "14px" }}>Game {4 - index}</span>}
                    description={
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                        You: {game.playerMove} | AI: {game.aiMove} | Result: {game.result}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        ) : (
          <span style={{ color: "#fff" }}>No games played yet.</span>
        )}
      </Card>
    </>
  );
};

export default GameHistory;