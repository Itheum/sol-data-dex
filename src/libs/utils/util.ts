import { BondContract } from "@itheum/sdk-mx-data-nft/out";
import { IS_DEVNET } from "libs/config";

export const qsParams = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  return params;
};

export const sleep = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

export const backendApi = (chainID: string) => {
  const envKey = chainID === "1" ? "VITE_ENV_BACKEND_MAINNET_API" : "VITE_ENV_BACKEND_API";
  const defaultUrl = chainID === "1" ? "https://production-itheum-api.up.railway.app" : "https://staging-itheum-api.up.railway.app";

  return import.meta.env[envKey] || defaultUrl;
};

export const gtagGo = (category: string, action: any, label: any, value?: any) => {
  return; // GA not implemented yet

  /*
  e.g.
  Category: 'Videos', Action: 'Play', Label: 'Gone With the Wind'
  Category: 'Videos'; Action: 'Play - Mac Chrome'
  Category: 'Videos', Action: 'Video Load Time', Label: 'Gone With the Wind', Value: downloadTime

  // AUTH
  Category: 'Auth', Action: 'Login', Label: 'Metamask'
  Category: 'Auth', Action: 'Login - Success', Label: 'Metamask'
  Category: 'Auth', Action: 'Login', Label: 'DeFi'
  Category: 'Auth', Action: 'Login', Label: 'Ledger'
  Category: 'Auth', Action: 'Login', Label: 'xPortalApp'
  Category: 'Auth', Action: 'Login', Label: 'WebWallet'

  Category: 'Auth', Action: 'Logout', Label: 'WebWallet'

  // Get Whitelist Page
  Category: 'GWT', Action: 'Join', Label: 'hero/useca/Testi' // tracking the join whitelist links
  Category: 'GWT', Action: 'Exp', Label: 'crd1/2/3' // explore trending collections

  */

  if (!action || !category) {
    console.error("gtag tracking needs both action and category");
    return;
  }

  const eventObj: Record<string, string> = {
    event_category: category,
  };

  if (label) {
    eventObj["event_label"] = label;
  }

  if (value) {
    eventObj["event_value"] = value;
  }

  if (window.location.hostname !== "localhost") {
    (window as any).gtag("event", action, eventObj);
  }
};

export const clearAppSessionsLaunchMode = () => {
  localStorage?.removeItem("itm-wallet-used");
  localStorage?.removeItem("itm-launch-mode");
  localStorage?.removeItem("itm-launch-env");
  localStorage?.removeItem("itm-datacat-linked");
  sessionStorage.removeItem("persist:sdk-dapp-signedMessageInfo"); // clear signedSessions
  localStorage?.removeItem("network"); // clear solana network
};

// Utility function to report a correct sentry profile for clear bucket logging
export const getSentryProfile = () => {
  let profile = "unknown";

  // this will handle production, dev and feature cicd build
  if (import.meta.env.VITE_ENV_SENTRY_PROFILE) {
    profile = import.meta.env.VITE_ENV_SENTRY_PROFILE;
  }

  // we cannot set ENV for our cicd stg build, so we do this manually
  if (location?.host?.toLowerCase() === "stg.datadex.itheum.io") {
    profile = "stage";
  }

  return profile;
};

export const getApiDataDex = () => {
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    return "https://api.itheumcloud.com/datadexapi";
  } else {
    return "https://api.itheumcloud-stg.com/datadexapi";
  }
};

export const getApiDataMarshal = () => {
  const envKey = import.meta.env.VITE_ENV_NETWORK === "mainnet" ? "VITE_ENV_DATAMARSHAL_MAINNET_API" : "VITE_ENV_DATAMARSHAL_DEVNET_API";
  const defaultUrl =
    import.meta.env.VITE_ENV_NETWORK === "mainnet"
      ? "https://api.itheumcloud.com/datamarshalapi/router/v1"
      : "https://api.itheumcloud-stg.com/datamarshalapi/router/v1";

  return import.meta.env[envKey] || defaultUrl;
};

export const getLivelinessScore = (seconds: number, lockPeriod: number) => {
  return (100 / lockPeriod) * seconds;
};

export const settingLivelinessScore = async (unbondTimestamp?: number, lockPeriod?: number): Promise<number | undefined> => {
  try {
    if (unbondTimestamp && lockPeriod) {
      const newDate = new Date();
      const currentTimestamp = Math.floor(newDate.getTime() / 1000);
      const difDays = currentTimestamp - unbondTimestamp;
      return difDays > 0 ? 0 : unbondTimestamp === 0 ? -1 : Number(Math.abs(getLivelinessScore(difDays, lockPeriod)).toFixed(2));
    }
  } catch (error) {
    return undefined;
  }
};

export function timeUntil(lockPeriod: number): { count: number; unit: string } {
  const seconds = lockPeriod;

  const intervals = [
    { seconds: 3153600000, unit: "century" },
    { seconds: 31536000, unit: "year" },
    { seconds: 2592000, unit: "month" },
    { seconds: 86400, unit: "day" },
    { seconds: 3600, unit: "hour" },
    { seconds: 60, unit: "minute" },
    { seconds: 1, unit: "second" },
  ];

  const interval = intervals.find((i) => i.seconds <= seconds) ?? intervals[0];
  const count = Math.floor(seconds / interval!.seconds);
  const unit = count === 1 ? interval!.unit : interval!.unit + "s";

  return { count, unit };
}

export const computeRemainingCooldown = (startTime: number, cooldown: number) => {
  const timePassedFromLastPlay = Date.now() - startTime;
  const _cooldown = cooldown - timePassedFromLastPlay;

  return _cooldown > 0 ? _cooldown + Date.now() : 0;
};
