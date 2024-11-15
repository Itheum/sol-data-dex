import { ContractsType } from "libs/types";
import { itheumTokenContractAddress_Solana_Devnet, itheumTokenContractAddress_Solana_Mainnet } from "./contractAddresses";

export function contractsForChain(chainID: string): ContractsType {
  switch (chainID) {
    case "SD": {
      return {
        itheumToken: itheumTokenContractAddress_Solana_Devnet,
      };
    }
    case "S1": {
      return {
        itheumToken: itheumTokenContractAddress_Solana_Mainnet,
      };
    }

    default:
      throw Error("Undefined chainID");
  }
}

export const uxConfig = {
  txConfirmationsNeededSml: 1,
  txConfirmationsNeededLrg: 2,
  dateStr: "DD/MM/YYYY",
  dateStrTm: "DD/MM/YYYY LT",
  mxAPITimeoutMs: 20000,
};

export const MENU = {
  HOME: 0,
  BUY: 1,
  SELL: 2,
  NFT: 6,
  NFTMINE: 10,
  LANDING: 16,
  NFTDETAILS: 17,
  NFMEID: 22,
  LIVELINESS: 22,
};

export const PATHS = {
  home: [0, [-1]],
  buydata: [1, [0]],
  tradedata: [2, [-1]],
  purchaseddata: [3, [0]],
  chaintransactions: [4, [3]],
  datanfts: [6, [1]],
  viewcoalitions: [7, [2]],
  advertiseddata: [9, [0]],
  wallet: [10, [1]],
  marketplace: [11, [1]],
  datacoalitions: [12, [2]],
  personaldataproof: [13, [0]],
  nftdetails: [17, [4]],
  offer: [17, [4]],
  getVerified: [18, [-1]],
};

export const CHAINS = {
  "SD": "Solana - Devnet",
  "S1": "Solana - Mainnet",
};

export const WALLETS = {
  SOLANA: "solana", // not sure if i need to check explicitly for which wallet is being used
};

export const consoleNotice = `DATA DEX NOTES --------------------------\n
1) Nothing to report for now...\n
-----------------------------------------`;

export const CHAIN_TX_VIEWER = {
  "SD": "///TODO solana explorer",
  "S1": "///TODO solana explorer",
};

export const CHAIN_TOKEN_SYMBOL = (chainID: string) => {
  const mapping: Record<string, any[]> = {
    ITHEUM: ["S1", "SD"],
  };

  let sym = null;

  Object.keys(mapping).some((i) => {
    if (mapping[i].includes(chainID)) {
      sym = i;
    }

    return mapping[i].includes(chainID);
  });

  return sym;
};

export const nfMeIDVaultConfig = {
  "program": "nfme-id-vault",
  "isNFMeID": true,
  "shouldAutoVault": true,
  additionalInformation: {
    "tokenName": "NFMeIDG1",
    "programName": "NFMe ID Avatar",
    "dataStreamURL_PRD": "https://api.itheumcloud.com/datadexapi/nfmeIdVault/dataStream?dmf-allow-http403=1",
    "dataStreamURL": "https://api.itheumcloud-stg.com/datadexapi/nfmeIdVault/dataStream?dmf-allow-http403=1",
    "dataPreviewURL": "https://api.itheumcloud.com/datadexapi/nfmeIdVault/previewStream",
    "img": "nfme_id_vault_preview",
    "description": "Activate this Gen1 NFMe ID Data NFT as your web3 identity.",
  },
};

export const IS_DEVNET = import.meta.env.VITE_ENV_NETWORK && import.meta.env.VITE_ENV_NETWORK === "devnet";

export const PRINT_UI_DEBUG_PANELS = import.meta.env.VITE_PRINT_UI_DEBUG_PANELS && import.meta.env.VITE_PRINT_UI_DEBUG_PANELS === "1";

export const EXPLORER_APP_FOR_TOKEN: Record<string, Record<string, string>> = {
  "SD": {
    "nftunes": "https://test.explorer.itheum.io/nftunes",
    "bitzgame": "https://test.explorer.itheum.io/getbitz",
  },
  "S1": {
    "nftunes": "https://explorer.itheum.io/nftunes",
    "bitzgame": "https://explorer.itheum.io/getbitz",
  },
};

export enum SOL_ENV_ENUM {
  devnet = "SD",
  mainnet = "S1",
}
