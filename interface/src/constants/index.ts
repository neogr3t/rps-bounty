import { Provider, Network } from "aptos";

export const provider = new Provider(Network.TESTNET);
export const moduleAddress = "0x62283b2652e2675341f3803e78e628712676d0d02e5671a39ca72d16f1543e0b";

export const moves = ["Rock", "Paper", "Scissors"];
export const results = ["Player Wins", "AI Wins", "Draw"];