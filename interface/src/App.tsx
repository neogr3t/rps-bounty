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
  HistoryOutlined,
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
        borderRadius: "15px",
        fontSize: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: selectedMove === index 
          ? "linear-gradient(135deg, #6e48aa, #9d50bb)" 
          : "linear-gradient(135deg, #283e51, #4b79a1)",
        color: "#fff",
        border: "none",
        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
        transition: "all 0.3s ease",
      }}
    >
      {move}
    </Button>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#0f0c29" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          background: "linear-gradient(90deg, #24243e, #302b63, #0f0c29)",
          height: "80px",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          <RocketOutlined /> Cosmic Rock Paper Scissors
        </Title>
        <WalletSelector />
      </Header>
      <Content style={{ padding: "20px" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              style={{
                background: "linear-gradient(135deg, #283e51, #4b79a1)",
                borderRadius: "15px",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              {gameState && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Statistic
                    title={<span style={{ color: "#fff" }}>Player Score</span>}
                    value={gameState.playerScore}
                    prefix={<UserOutlined style={{ color: "#ffd700" }} />}
                    valueStyle={{ color: "#ffd700" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff" }}>AI Score</span>}
                    value={gameState.aiScore}
                    prefix={<RobotOutlined style={{ color: "#ff4500" }} />}
                    valueStyle={{ color: "#ff4500" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff" }}>Draws</span>}
                    value={gameState.draws}
                    prefix={<BarChartOutlined style={{ color: "#00ced1" }} />}
                    valueStyle={{ color: "#00ced1" }}
                  />
                  <Statistic
                    title={<span style={{ color: "#fff" }}>Games Played</span>}
                    value={gameState.gamesPlayed}
                    prefix={<TrophyOutlined style={{ color: "#9370db" }} />}
                    valueStyle={{ color: "#9370db" }}
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
                      "0%": "#108ee9",
                      "100%": "#87d068",
                    }}
                  />
                  <div style={{ color: "#fff", textAlign: "center", marginTop: "10px" }}>
                    Win Rate: {calculateWinPercentage(gameState.playerScore, gameState.gamesPlayed)}%
                  </div>
                </Space>
              )}
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card
              style={{
                background: "linear-gradient(135deg, #24243e, #302b63)",
                borderRadius: "15px",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              {!account ? (
                <Text style={{ color: "#fff", fontSize: "18px" }}>
                  Please connect your wallet to play.
                </Text>
              ) : !gameInitialized ? (
                <Button
                  onClick={initializeGame}
                  type="primary"
                  size="large"
                  style={{ 
                    width: "100%",
                    background: "linear-gradient(135deg, #6e48aa, #9d50bb)",
                    border: "none",
                  }}
                >
                  Initialize Game
                </Button>
              ) : (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Title level={3} style={{ color: "#fff", textAlign: "center", margin: 0 }}>
                    Choose your move:
                  </Title>
                  <Row justify="center" gutter={[16, 16]}>
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
                      marginTop: "20px",
                      background: "linear-gradient(135deg, #6e48aa, #9d50bb)",
                      border: "none",
                    }}
                  >
                    Play!
                  </Button>
                  {gameState && gameState.gamesPlayed > 0 && (
                    <>
                      <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                      <Text style={{ color: "#fff", fontSize: "18px", textAlign: "center" }}>
                        Last Result: {results[gameState.lastResult] || "N/A"}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: "18px", textAlign: "center" }}>
                        Your Last Move: {moves[gameState.playerLastMove] || "N/A"}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: "18px", textAlign: "center" }}>
                        AI's Last Move: {moves[gameState.aiLastMove] || "N/A"}
                      </Text>
                    </>
                  )}
                  <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                  <Title level={4} style={{ color: "#fff", textAlign: "center" }}>
                    <HistoryOutlined /> Recent 5 Games:
                  </Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={gameHistory}
                    renderItem={(game, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "#6e48aa" }} />}
                          title={<span style={{ color: "#fff" }}>Game {gameHistory.length - index}</span>}
                          description={
                            <span style={{ color: "rgba(255,255,255,0.7)" }}>
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
      </Content>

      <Modal
        title={<span style={{ color: "#fff", fontSize: "24px", fontWeight: "bold" }}>Game Result</span>}
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            style={{ 
              background: "linear-gradient(135deg, #6e48aa, #9d50bb)",
              borderColor: "#6e48aa",
              color: "#fff",
              borderRadius: "5px"
            }}
            onClick={() => setIsModalVisible(false)}
          >
            OK
          </Button>,
        ]}
        bodyStyle={{ 
          background: "linear-gradient(135deg, #24243e, #302b63)",
          color: "#fff",
          fontSize: "18px",
          padding: "20px",
          borderRadius: "10px",
        }}
        centered
        width={400}
      >
        {modalContent && (
          <div style={{ textAlign: "center" }}>
            <p>Player's Move: <strong style={{ color: "#ffd700" }}>{modalContent.playerMove}</strong></p>
            <p>AI's Move: <strong style={{ color: "#ff4500" }}>{modalContent.aiMove}</strong></p>
            <p style={{ fontSize: "20px", fontWeight: "bold", color: "#00ced1" }}>Result: {modalContent.result}</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default App;