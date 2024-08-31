import React from 'react';
import { Layout, Typography, Tag } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { AptosClient } from 'aptos';


const { Header: AntHeader } = Layout;
const { Title } = Typography;

const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');


const Header: React.FC = () => {
  const { account, network } = useWallet();
  const [balance, setBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
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

    if (account) {
      fetchBalance();
    }
  }, [account]);

  return (
    <AntHeader
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
    </AntHeader>
  );
};

export default Header;