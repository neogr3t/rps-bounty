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
  Tag,
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
import { AptosClient } from 'aptos';


const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');


const { Title, Text } = Typography;
const { Header, Content } = Layout;

const provider = new Provider(Network.TESTNET);
const moduleAddress =
  "0x62283b2652e2675341f3803e78e628712676d0d02e5671a39ca72d16f1543e0b";

  interface GameState {
    playerScore: number;
    aiScore: number;
    gamesPlayed: number;
    draws: number;
  }

  interface GameHistoryItem {
    playerMove: string;
    aiMove: string;
    result: string;
    sequenceNumber: string; // Use sequenceNumber instead of timestamp
  }

  
  interface GameEvent {
    data: {
      player_choice: string;
      ai_choice: string;
      result: string;
    };
    sequence_number: string;
    type: string;
  }

function App() {
  const { account, signAndSubmitTransaction,connected,network } = useWallet();
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
  const [balance, setBalance] = useState<number | null>(null);


  const moves = ["Rock", "Paper", "Scissors"];
  const results = ["Player Wins", "AI Wins", "Draw"];

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const resources: any[] = await client.getAccountResources(account.address);
          const accountResource = resources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
          
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance(balanceValue ? parseInt(balanceValue) / 100000000 : 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    if (connected) {
      fetchBalance();
    }
  }, [account, connected]);


  useEffect(() => {
    const storedHistory = localStorage.getItem('gameHistory');
    if (storedHistory) {
      setGameHistory(JSON.parse(storedHistory));
    }
  }, []);
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
      });
      setGameInitialized(true);
    } catch (e) {
      console.error("Error fetching game state:", e);
      setGameInitialized(false);
      setGameState(null);
    }
  };

  const fetchGameHistory = async () => {
    if (!account || !gameInitialized) {
      setGameHistory([]);
      return;
    }
    try {
      const events = await provider.getEventsByEventHandle(account.address, 
        `${moduleAddress}::rock_paper_scissors::GameEventHandle`,
        "game_events"
      );
      
      const history = events.map((event: GameEvent) => ({
        playerMove: moves[Number(event.data.player_choice)],
        aiMove: moves[Number(event.data.ai_choice)],
        result: results[Number(event.data.result)],
        sequenceNumber: event.sequence_number
      })).reverse().slice(0, 5);
      
      setGameHistory(history);
    } catch (error) {
      console.error("Error fetching game history:", error);
      setGameHistory([]);
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
      
      // Fetch the game event to get the AI's move and the result
      const events = await provider.getEventsByEventHandle(account.address, 
        `${moduleAddress}::rock_paper_scissors::GameEventHandle`,
        "game_events"
      );
      
      if (events.length > 0) {
        const latestEvent = events[events.length - 1] as GameEvent;
        const playerMove = moves[Number(latestEvent.data.player_choice)];
        const aiMove = moves[Number(latestEvent.data.ai_choice)];
        const result = results[Number(latestEvent.data.result)];
        
        setModalContent({ playerMove, aiMove, result });
        setIsModalVisible(true);

        // Update game history
        const newHistoryItem: GameHistoryItem = { 
          playerMove, 
          aiMove, 
          result,
          sequenceNumber: latestEvent.sequence_number
        };
        const updatedHistory = [newHistoryItem, ...gameHistory].slice(0, 5);
        setGameHistory(updatedHistory);
      }

      // Fetch the updated game state after the move
      await fetchGameState();

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
    const fetchGameHistory = async () => {
      if (!account) return;
      try {
        const events = await provider.getEventsByEventHandle(account.address, 
          `${moduleAddress}::rock_paper_scissors::GameEventHandle`,
          "game_events"
        );
        
        const history = events.map((event: GameEvent) => {
          return {
            playerMove: moves[Number(event.data.player_choice)],
            aiMove: moves[Number(event.data.ai_choice)],
            result: results[Number(event.data.result)],
            sequenceNumber: event.sequence_number
          };
        }).reverse().slice(0, 5);
        
        setGameHistory(history);
      } catch (error) {
        console.error("Error fetching game history:", error);
      }
    };

    if (account) {
      fetchGameHistory();
    }
  }, [account]);
  useEffect(() => {
    if (account) {
      fetchGameState();
    } else {
      setGameInitialized(false);
      setGameState(null);
      setGameHistory([]);
    }
  }, [account]);

  useEffect(() => {
    fetchGameHistory();
  }, [gameInitialized, account]);

 

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
    background: "linear-gradient(135deg, rgba(26, 41, 128, 0.8), rgba(0, 0, 0, 0.8))",
    height: "80px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
    borderBottom: "2px solid rgba(0, 255, 255, 0.2)",
  }}
>
  <Title level={3} style={{ color: "#00ffff", margin: 0, textShadow: "2px 2px 10px rgba(0, 255, 255, 0.5)" }}>
    <RocketOutlined style={{ marginRight: "10px" }} /> Neosmic RPS
  </Title>
  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      {account && (
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <Tag color="blue" style={{ padding: "2px 8px", fontSize: "12px" }}>
            {network ? network.name : 'Unknown Network'}
          </Tag>
          <Tag color="green" style={{ padding: "2px 8px", fontSize: "12px" }}>
            {balance !== null ? `${balance.toFixed(2)} APT` : 'Loading...'}
          </Tag>
        </div>
      )}
      <WalletSelector />
    </div>
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
                <Title level={2} style={{ color: "#fff", marginBottom: "30px" }}>Welcome to Neosmic RPS!</Title>
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
                      {gameHistory.length > 0 ? (
                        <List
                          itemLayout="horizontal"
                          dataSource={gameHistory}
                          renderItem={(game, index) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "#00ffff" }} />}
                                title={<span style={{ color: "#fff", fontSize: "14px" }}>Game {index + 1}</span>}
                                description={
                                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                                    You: {game.playerMove} | AI: {game.aiMove} | Result: {game.result}
                                  </span>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Text style={{ color: "#fff" }}>No games played yet.</Text>
                      )}
                    </Card>
              </Space>
            </Col>
          </Row>
        )}
      </Content>

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
      <Title level={2} style={{ color: "#00ffff", marginBottom: "30px", textShadow: "0 0 10px rgba(0, 255, 255, 0.5)" }}>
        Game Result
      </Title>
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

    </Layout>
  );
}

export default App;