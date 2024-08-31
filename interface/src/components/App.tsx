import React, { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Layout, Row, Col, Space, message as antdMessage } from "antd";
import Header from "./Header";
import GameBoard from "./GameBoard";
import GameHistory from "./GameHistory";
import ResultModal from "./ResultModal";
import { GameState, GameHistoryItem, ModalContent } from "../types";
import { initializeGame, playGame, fetchGameState, fetchGameHistory } from "../utils/gameLogic";
import { provider, moduleAddress } from "../constants";
import WelcomeCard from './WelcomeCard';

const { Content } = Layout;

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  useEffect(() => {
    if (account) {
      fetchGameState(account, provider, moduleAddress, setGameState, setGameInitialized);
      fetchGameHistory(account, provider, moduleAddress, setGameHistory);
    } else {
      setGameInitialized(false);
      setGameState(null);
      setGameHistory([]);
    }
  }, [account]);

  const handleInitializeGame = async () => {
    if (!account) return;
    try {
      await initializeGame(account, signAndSubmitTransaction, moduleAddress, provider);
      await fetchGameState(account, provider, moduleAddress, setGameState, setGameInitialized);
      antdMessage.success("Game initialized successfully!");
    } catch (error) {
      console.error("Error initializing game:", error);
      antdMessage.error("Failed to initialize game");
    }
  };

  const handlePlayGame = async (moveIndex: number) => {
    if (!account) return;
    try {
      const result = await playGame(account, signAndSubmitTransaction, moduleAddress, provider, moveIndex);
      setModalContent(result);
      setIsModalVisible(true);
      await fetchGameState(account, provider, moduleAddress, setGameState, setGameInitialized);
      await fetchGameHistory(account, provider, moduleAddress, setGameHistory);
      antdMessage.success("Move submitted successfully!");
      setSelectedMove(null);
    } catch (error) {
      console.error("Error playing game:", error);
      antdMessage.error("Failed to submit move");
    }
  };

  return (
    <Layout style={{
      minHeight: "100vh",
      background: `url('https://images.pexels.com/photos/2212858/pexels-photo-2212858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1') no-repeat center center fixed`,
      backgroundSize: 'cover',
    }}>
      <Header />
      <Content style={{ padding: "20px", height: "calc(100vh - 80px)", overflow: "hidden" }}>
        {!account ? (
          <Row justify="center" align="middle" style={{ height: "100%" }}>
                        <WelcomeCard />

          </Row>
        ) : (
          <Row gutter={[24, 24]} style={{ height: "100%" }}>
            <Col xs={24} lg={16} style={{ height: "100%" }}>
              <GameBoard
                gameInitialized={gameInitialized}
                initializeGame={handleInitializeGame}
                selectedMove={selectedMove}
                setSelectedMove={setSelectedMove}
                playGame={handlePlayGame}
              />
            </Col>
            <Col xs={24} lg={8} style={{ height: "100%", overflowY: "auto" }}>
              <Space direction="vertical" size="large" style={{ width: "100%", paddingRight: "20px" }}>
                {gameState && (
                  <GameHistory gameState={gameState} gameHistory={gameHistory} />
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Content>
      <ResultModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        modalContent={modalContent}
      />
    </Layout>
  );
}

export default App;