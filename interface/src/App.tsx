import React, { useEffect, useState } from "react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Layout,
  Row,
  Col,
  Button,
  Typography,
  message as antdMessage,
  Space,
  Card,
  Modal,
  Statistic,
  Progress,
  List,
  Avatar,
} from "antd";
import { Network, Provider } from "aptos";
import {
  RocketOutlined,
  TrophyOutlined,
  UserOutlined,
  RobotOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const provider = new Provider(Network.TESTNET);
const moduleAddress =
  "0x82fd59ce477adfde4f8a04a36df26c24cec7540ae9b398e1b6ab86f6e0a00945";

interface GameState {
  playerScore: number;
  aiScore: number;
  gamesPlayed: number;
  draws: number;
  lastResult: number;
  playerLastMove: number;
  aiLastMove: number;
}

interface GameHistoryItem {
  playerMove: string;
  aiMove: string;
  result: string;
}

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    playerMove: string;
    aiMove: string;
    result: string;
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  const moves = ["Rock", "Paper", "Scissors"];
  const results = ["Player Wins", "AI Wins", "Draw"];

  useEffect(() => {
    const storedHistory = localStorage.getItem('gameHistory');
    if (storedHistory) {
      setGameHistory(JSON.parse(storedHistory));
    }
  }, []);

  const fetchGameState = async () => {
    if (!account) return;
    try {
      const resource = await provider.getAccountResource(
        account.address,
        `${moduleAddress}::rock_paper_scissors::GameState`
      );
      const state = resource.data as any;
      setGameState({
        playerScore: Number(state.player_wins),
        aiScore: Number(state.ai_wins),
        gamesPlayed: Number(state.games_played),
        draws: Number(state.draws),
        lastResult: Number(state.last_game_result.result),
        playerLastMove: Number(state.last_game_result.player_choice),
        aiLastMove: Number(state.last_game_result.ai_choice),
      });
      setGameInitialized(true);
    } catch (e) {
      console.error("Error fetching game state:", e);
      setGameInitialized(false);
    }
  };

  const initializeGame = async () => {
    if (!account) return;
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::rock_paper_scissors::initialize_game`,
        type_arguments: [],
        arguments: [],
      };
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      await fetchGameState();
      antdMessage.success("Game initialized successfully!");
      setGameInitialized(true);
    } catch (error) {
      console.error("Error initializing game:", error);
      antdMessage.error("Failed to initialize game");
    }
  };

  const playGame = async (moveIndex: number) => {
    if (!account) return;
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::rock_paper_scissors::play_game`,
        type_arguments: [],
        arguments: [moveIndex],
      };
      const response = await signAndSubmitTransaction(payload);
      await provider.waitForTransaction(response.hash);
      await fetchGameState();

      if (gameState) {
        const playerMove = moves[moveIndex];
        const aiMove = moves[gameState.aiLastMove];
        const result = results[gameState.lastResult];
        setModalContent({ playerMove, aiMove, result });
        setIsModalVisible(true);

        const updatedHistory = [
          { playerMove, aiMove, result },
          ...gameHistory.slice(0, 4),
        ];

        setGameHistory(updatedHistory);
        localStorage.setItem('gameHistory', JSON.stringify(updatedHistory));
      }

      antdMessage.success("Move submitted successfully!");
      setSelectedMove(null);
    } catch (error) {
      console.error("Error playing game:", error);
      antdMessage.error("Failed to submit move");
    }
  };

  const calculateWinPercentage = (wins: number, total: number): string => {
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  };

    useEffect(() => {
    if (account) {
      fetchGameState();
    } else {
      setGameInitialized(false);
      setGameState(null);
    }
  }, [account]);

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

  const renderStatCard = (title: string, value: number, icon: React.ReactNode, color: string) => (
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

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: `url('https://images.pexels.com/photos/2212858/pexels-photo-2212858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1') no-repeat center center fixed`,
        backgroundSize: 'cover',
      }}
    >
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          background: "rgba(26, 41, 128, 0.8)",
          height: "80px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0, textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
          <RocketOutlined /> Cosmic RPS
        </Title>
        <WalletSelector />
      </Header>
      <Content style={{ padding: "20px", height: "calc(100vh - 80px)", overflow: "hidden" }}>
        {!account ? (
          <Row justify="center" align="middle" style={{ height: "100%" }}>
            <Col xs={24} sm={20} md={16} lg={12}>
              <Card
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  padding: "50px",
                  textAlign: "center",
                }}
              >
                <Title level={2} style={{ color: "#fff", marginBottom: "30px" }}>Welcome to Cosmic RPS!</Title>
                <Text style={{ color: "#fff", fontSize: "18px", display: "block", marginBottom: "30px" }}>
                  Connect your wallet to start playing Rock Paper Scissors against the AI.
                </Text>
                <WalletSelector />
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[24, 24]} style={{ height: "100%" }}>
            <Col xs={24} lg={16} style={{ height: "100%" }}>
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
                    <Title level={2} style={{ color: "#fff", textAlign: "center", margin: "0 0 20px", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
                      Choose your move:
                    </Title>
                    <Row justify="center" gutter={[32, 32]}>
                      {["Rock", "Paper", "Scissors"].map((move, index) => (
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
            </Col>
            <Col xs={24} lg={8} style={{ height: "100%", overflowY: "auto" }}>
              <Space direction="vertical" size="large" style={{ width: "100%", paddingRight: "20px" }}>
                {gameState && (
                  <>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        {renderStatCard("Player Score", gameState.playerScore, <UserOutlined />, "#ffd700")}
                      </Col>
                      <Col span={12}>
                        {renderStatCard("AI Score", gameState.aiScore, <RobotOutlined />, "#ff4500")}
                      </Col>
                      <Col span={12}>
                        {renderStatCard("Draws", gameState.draws, <BarChartOutlined />, "#00ced1")}
                      </Col>
                      <Col span={12}>
                        {renderStatCard("Games Played", gameState.gamesPlayed, <TrophyOutlined />, "#9370db")}
                      </Col>
                    </Row>
                    <Card
                      style={{
                        background: "rgba(26, 41, 128, 0.7)",
                        borderRadius: "15px",
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
                        border: "none",
                        backdropFilter: "blur(10px)",
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
                  </>
                )}
                <Card
                  title={<Title level={4} style={{ color: "#fff", margin: 0 }}>Recent Games</Title>}
                  style={{
                    background: "rgba(26, 41, 128, 0.7)",
                    borderRadius: "15px",
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
                    border: "none",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <List
                    itemLayout="horizontal"
                    dataSource={gameHistory.slice(0, 5)}
                    renderItem={(game, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "#00ffff" }} />}
                          title={<span style={{ color: "#fff", fontSize: "14px" }}>Game {gameHistory.length - index}</span>}
                          description={
                            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                              You: {game.playerMove} | AI: {game.aiMove} | Result: {game.result}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Space>
            </Col>
          </Row>
        )}
      </Content>

      <Modal
        title={<span style={{ fontSize: "24px", fontWeight: "bold",  textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>Game Result</span>}
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            style={{ 
              background: "linear-gradient(135deg, #00ffff, #00bfff)",
              borderColor: "#00ffff",
              color: "#fff",
              borderRadius: "20px",
              fontSize: "16px",
              height: "36px",
              width: "100px",
            }}
            onClick={() => setIsModalVisible(false)}
          >
            OK
          </Button>,
        ]}
        bodyStyle={{ 
          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(26, 41, 128, 0.8))",
          color: "#fff",
          fontSize: "18px",
          padding: "24px",
          borderRadius: "15px",
        }}
        centered
        width={400}
      >
        {modalContent && (
          <div style={{ textAlign: "center" }}>
            <p>Player's Move: <strong style={{ color: "#00ffff", fontSize: "20px" }}>{modalContent.playerMove}</strong></p>
            <p>AI's Move: <strong style={{ color: "#ff4500", fontSize: "20px" }}>{modalContent.aiMove}</strong></p>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#00ced1", marginTop: "16px" }}>Result: {modalContent.result}</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default App;