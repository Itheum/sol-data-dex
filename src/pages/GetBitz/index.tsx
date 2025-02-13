import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import GetBitzSol from "./GetBitzSol/indexRoulette";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode, onIsDataMarshalFetching, onHideBitzModel } = props;
  const { connected } = useWallet();

  return <>{connected && <GetBitzSol modalMode={modalMode} onIsDataMarshalFetching={onIsDataMarshalFetching} onHideBitzModel={onHideBitzModel} />}</>;
};

export default GetBitz;
