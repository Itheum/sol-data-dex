import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import GetBitzSol from "./GetBitzSol";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode, onIsDataMarshalFetching } = props;
  const { connected } = useWallet();

  return <>{connected && <GetBitzSol modalMode={modalMode} onIsDataMarshalFetching={onIsDataMarshalFetching} />}</>;
};

export default GetBitz;
