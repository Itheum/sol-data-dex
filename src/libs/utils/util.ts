export const qsParams = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  return params;
};

export const sleep = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

export const backendApi = () => {
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    return "https://production-itheum-api.up.railway.app";
  } else {
    return "https://staging-itheum-api.up.railway.app";
  }
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
  if (location?.host?.toLowerCase() === "stg.datadex-sol.itheum.io") {
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
  const defaultUrl =
    import.meta.env.VITE_ENV_NETWORK === "mainnet"
      ? "https://api.itheumcloud.com/datamarshalapi/router/v1"
      : "https://api.itheumcloud-stg.com/datamarshalapi/router/v1";

  return import.meta.env.VITE_ENV_DATAMARSHAL_API || defaultUrl;
};

export const getLivelinessScore = (seconds: number, lockPeriod: number) => {
  return (100 / lockPeriod) * seconds;
};

export const settingLivelinessScore = async (unbondTimestamp?: number, lockPeriod?: number, useThisDateNowTS?: number): Promise<number | undefined> => {
  try {
    if (unbondTimestamp && lockPeriod) {
      let currentTimestamp = Math.floor(Date.now() / 1000);

      // .. did the host component provide a fixed Date.now to work with?
      if (useThisDateNowTS && useThisDateNowTS > 0) {
        currentTimestamp = Math.floor(useThisDateNowTS / 1000);
      }

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

/*
  convert images like this:
  https://ipfs.io/ipfs/QmXvejPK55ds46fyek6jtNCHw1Pujx9iSzd3xjCjkvEvZc
  to 
  https://gateway.pinata.cloud/ipfs/QmXvejPK55ds46fyek6jtNCHw1Pujx9iSzd3xjCjkvEvZc
  */
export function replacePublicIPFSImgWithGatewayLink(ipfsImgLink: string) {
  if (ipfsImgLink.includes("https://ipfs.io/ipfs/")) {
    const CID = ipfsImgLink.split("https://ipfs.io/ipfs/")[1];
    return `https://gateway.pinata.cloud/ipfs/${CID}`;
  } else {
    return ipfsImgLink;
  }
}
