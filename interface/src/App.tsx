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
  Divider,
  List,
  Avatar,
} from "antd";
import { Network, Provider } from "aptos";
import {
  RocketOutlined,
  TrophyOutlined,
  StarOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  UserOutlined,
  RobotOutlined,
  BarChartOutlined,
  WalletOutlined,
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
        width: "130px",
        height: "130px",
        borderRadius: "50%",
        fontSize: "20px",
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
    <Layout
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: `url('https://images.pexels.com/photos/2212858/pexels-photo-2212858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1') no-repeat center center fixed`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0, textShadow: "2px 2px 4px rgba(0,0,0,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <RocketOutlined /> Cosmic RPS
        </Title>
        <WalletSelector />
      </Header>
      <Content style={{ padding: "40px 20px", maxWidth: "100%", overflowX: "hidden" }}>
        {!account ? (
          <Row justify="center" align="middle" style={{ minHeight: "calc(100vh - 80px)" }}>
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
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <RocketOutlined style={{ fontSize: "80px", color: "#00ffff" }} />
                  <Title level={1} style={{ 
                    color: "#e0e0e0", 
                    fontSize: "48px",
                    fontWeight: "bold",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    marginBottom: "30px",
                  }}>
                    Welcome to Cosmic Rock Paper Scissors!
                  </Title>
                  <Text style={{ 
                    color: "#b0b0b0", 
                    fontSize: "24px",
                    display: "block", 
                    margin: "20px 0", 
                  }}>
                    Embark on an intergalactic journey of strategy and chance.
                  </Text>
                  <Button
                    icon={<WalletOutlined />}
                    size="large"
                    style={{
                      background: "linear-gradient(135deg, #00ffff, #00bfff)",
                      borderColor: "#00ffff",
                      color: "#fff",
                      fontSize: "20px",
                      height: "50px",
                      borderRadius: "25px",
                      marginTop: "20px",
                    }}
                  
                  >
                    Connect Wallet to Play
                  </Button>
                  <Row gutter={[16, 16]} style={{ marginTop: "40px" }}>
                    <Col xs={24} sm={8}>
                      <Card style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "15px",
                        padding: "20px",
                      }}>
                        <ThunderboltOutlined style={{ fontSize: "40px", color: "#ffd700" }} />
                        <Text style={{ color: "#ffd700", fontSize: "18px", display: "block", marginTop: "10px" }}>
                          Lightning-fast Gameplay
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "15px",
                        padding: "20px",
                      }}>
                        <StarOutlined style={{ fontSize: "40px", color: "#ff4500" }} />
                        <Text style={{ color: "#ff4500", fontSize: "18px", display: "block", marginTop: "10px" }}>
                          Stellar Rewards
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "15px",
                        padding: "20px",
                      }}>
                        <RobotOutlined style={{ fontSize: "40px", color: "#00ced1" }} />
                        <Text style={{ color: "#00ced1", fontSize: "18px", display: "block", marginTop: "10px" }}>
                          AI Opponents
                        </Text>
                      </Card>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} md={8} lg={6}>
              <Card
                style={{
                  background: "rgba(26, 41, 128, 0.7)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                  border: "none",
                  backdropFilter: "blur(10px)",
                }}
              >
              {gameState && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Statistic
                    title={<span style={{ color: "#fff", fontSize: "18px" }}>Player Score</span>}
                    value={gameState.playerScore}
                    prefix={<UserOutlined style={{ color: "#ffd700" }} />}
                    valueStyle={{ color: "#ffd700", fontSize: "28px" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff", fontSize: "18px" }}>AI Score</span>}
                    value={gameState.aiScore}
                    prefix={<RobotOutlined style={{ color: "#ff4500" }} />}
                    valueStyle={{ color: "#ff4500", fontSize: "28px" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff", fontSize: "18px" }}>Draws</span>}
                    value={gameState.draws}
                    prefix={<BarChartOutlined style={{ color: "#00ced1" }} />}
                    valueStyle={{ color: "#00ced1", fontSize: "28px" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff", fontSize: "18px" }}>Games Played</span>}
                    value={gameState.gamesPlayed}
                    prefix={<TrophyOutlined style={{ color: "#9370db" }} />}
                    valueStyle={{ color: "#9370db", fontSize: "28px" }}
                  />
                  <Progress
                    percent={Number(
                      calculateWinPercentage(
                        gameState.playerScore,
                        gameState.gamesPlayed
                      )
                    )}
                    status="active"
                    strokeColor={{
                      "0%": "#00ffff",
                      "100%": "#00bfff",
                    }}
                    trailColor="rgba(255, 255, 255, 0.2)"
                  />
                  <div style={{ color: "#fff", textAlign: "center", marginTop: "10px", fontSize: "18px" }}>
                    Win Rate: {calculateWinPercentage(gameState.playerScore, gameState.gamesPlayed)}%
                  </div>
                </Space>
              )}
            </Card>
          </Col>
          <Col xs={24} md={16} lg={18}>
  <Card
    style={{
      background: "rgba(0, 0, 0, 0.6)", // Slightly transparent for a better blend with the background
      borderRadius: "20px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)", 
      border: "1px solid rgba(255, 255, 255, 0.2)", // Light border for separation
      backdropFilter: "blur(10px)",
      padding: "50px", // Added padding for content spacing
      textAlign: "center", // Center the text content
    }}
  >
      {!account ? (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <RocketOutlined style={{ fontSize: "80px", color: "#00ffff" }} />
                  <Title level={1} style={{ 
                    color: "#e0e0e0", 
                    fontSize: "48px",
                    fontWeight: "bold",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    marginBottom: "30px",
                  }}>
                    Welcome to Cosmic Rock Paper Scissors!
                  </Title>
                  <Text style={{ 
                    color: "#b0b0b0", 
                    fontSize: "24px",
                    display: "block", 
                    margin: "20px 0", 
                  }}>
                    Embark on an intergalactic journey of strategy and chance.
                  </Text>
                  <Space size="large" style={{ marginTop: "40px" }}>
                    <Card style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "15px",
                      padding: "20px",
                      width: "200px",
                    }}>
                      <ThunderboltOutlined style={{ fontSize: "40px", color: "#ffd700" }} />
                      <Text style={{ color: "#ffd700", fontSize: "18px", display: "block", marginTop: "10px" }}>
                        Lightning-fast Gameplay
                      </Text>
                    </Card>
                    <Card style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "15px",
                      padding: "20px",
                      width: "200px",
                    }}>
                      <StarOutlined style={{ fontSize: "40px", color: "#ff4500" }} />
                      <Text style={{ color: "#ff4500", fontSize: "18px", display: "block", marginTop: "10px" }}>
                        Stellar Rewards
                      </Text>
                    </Card>
                    <Card style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "15px",
                      padding: "20px",
                      width: "200px",
                    }}>
                      <RobotOutlined style={{ fontSize: "40px", color: "#00ced1" }} />
                      <Text style={{ color: "#00ced1", fontSize: "18px", display: "block", marginTop: "10px" }}>
                        AI Opponents
                      </Text>
                    </Card>
                  </Space>
                </Space>
              ) : !gameInitialized ? (
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
                  {gameState && gameState.gamesPlayed > 0 && (
                    <>
                      <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                      <Text style={{ color: "#00ffff", fontSize: "20px", textAlign: "center", display: "block" }}>
                        Last Result: {results[gameState.lastResult] || "N/A"}
                      </Text>
                      <Text style={{ color: "#00bfff", fontSize: "18px", textAlign: "center", display: "block" }}>
                        Your Last Move: {moves[gameState.playerLastMove] || "N/A"}
                      </Text>
                      <Text style={{ color: "#26d0ce", fontSize: "18px", textAlign: "center", display: "block" }}>
                        AI's Last Move: {moves[gameState.aiLastMove] || "N/A"}
                      </Text>
                    </>
                  )}
                  <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                  <Title level={3} style={{ color: "#fff", textAlign: "center", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
                    <HistoryOutlined /> Recent 5 Games:
                  </Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={gameHistory}
                    renderItem={(game, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "#00ffff" }} />}
                          title={<span style={{ color: "#fff", fontSize: "18px" }}>Game {gameHistory.length - index}</span>}
                          description={
                            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
                              You: {game.playerMove} | AI: {game.aiMove} | Result: {game.result}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Space>
              )}
            </Card>
          </Col>
        </Row>
        )}
      </Content>

      <Modal
        title={<span style={{ color: "#fff", fontSize: "28px", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>Game Result</span>}
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
              fontSize: "18px",
              height: "40px",
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
          fontSize: "20px",
          padding: "30px",
          borderRadius: "20px",
        }}
        centered
        width={450}
      >
        {modalContent && (
          <div style={{ textAlign: "center" }}>
            <p>Player's Move: <strong style={{ color: "#00ffff", fontSize: "24px" }}>{modalContent.playerMove}</strong></p>
            <p>AI's Move: <strong style={{ color: "#ff4500", fontSize: "24px" }}>{modalContent.aiMove}</strong></p>
            <p style={{ fontSize: "28px", fontWeight: "bold", color: "#00ced1", marginTop: "20px" }}>Result: {modalContent.result}</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default App;