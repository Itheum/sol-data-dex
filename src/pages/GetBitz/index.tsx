import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import GetBitzSol from "./GetBitzSol";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode } = props;
  const { connected } = useWallet();

  return <>{connected && <GetBitzSol modalMode={modalMode} />}</>;
};

export default GetBitz;
