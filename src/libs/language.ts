export const labels = {
  "ERR_URL_MISSING_HTTPS_OR_IPNS":
    "Some of your url inputs don't seem to be valid. For e.g. stream URLs or marshal service URLs need to have https:// , ipfs:// or ipns:// in it. (ER-1)",
  "ERR_DATA_MARSHAL_DOWN": "Data Marshal service is not responding. (ER-2)",
  "ERR_MINT_FORM_NO_WALLET_CONN": "Connect your wallet to proceed with mint. (ER-14)",
  "ERR_MINT_FORM_NOT_ENOUGH_TAX": "You have insufficient ITHEUM tokens for the Anti-Spam Tax. (ER-19)",
  "ERR_MINT_FORM_GEN_IMG_API_DOWN": "Generative image generation service is not responding. (ER-20)",
  "ERR_IPFS_ASSET_SAVE_FAILED":
    "Could not save the img and or metadata assets to IPFS. There is a chance that your firewall is blocking IPFS, please disable it and try again. (ER-31)",
  "ERR_MINT_TX_GEN_COMMAND_FAILED": "Could not generate the Data NFT mint transaction. (ER-32)",
  "ERR_SOL_CANT_GET_ONCHAIN_CONFIG":
    "Unable to get bonding and rewards config from the Solana blockchain so you cannot proceed with the mint. Please reload the page to try again. (ER-36)",
  "ERR_MINT_FORM_NOT_ENOUGH_BOND": "You have insufficient ITHEUM tokens for the Liveliness Bonding.",
  "ERR_SUCCESS_MINT_BUT_BOND_NOT_CREATED": "Your mint was a success, but could not create a bonding transaction. (ER-34)",
  "ERR_SUCCESS_MINT_BUT_BONDING_TRANSACTION_FAILED": "Your mint was a success, but the bonding transaction has failed (ER-35)",
};
