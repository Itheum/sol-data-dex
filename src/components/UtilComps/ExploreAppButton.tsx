import React from "react";
import { Button, Text, Tooltip, Box } from "@chakra-ui/react";
import { EXPLORER_APP_FOR_TOKEN } from "libs/config";
import { SolEnvEnum } from "libs/Solana/config";

export default function ExploreAppButton({
  tokenName,
  w,
  size,
  fontSize,
  customLabel,
  customMargin,
}: {
  tokenName: string;
  w?: object;
  size?: any;
  fontSize?: any;
  customLabel?: string;
  customMargin?: number;
}) {
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SolEnvEnum.devnet : SolEnvEnum.mainnet;

  const shouldShowTheButton = () => {
    if (tokenName.includes("MUS")) {
      return true;
    }
    return false;
  };

  const shouldShowTheButtonVariable = shouldShowTheButton();

  return (
    <>
      {shouldShowTheButtonVariable ? (
        <Box m={customMargin ? customMargin : "initial"} my="2">
          <Tooltip hasArrow label="Unlocks custom app on Itheum Explorer">
            <Button
              size={size ? size : "sm"}
              bgGradient="linear(to-r, #ffce00, #ff7201)"
              _hover={{
                bgGradient: "linear(to-r, #ff7201, #ffce00)",
              }}
              w={w ? w : "full"}
              h="32px"
              onClick={() => {
                window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}`, "_blank");
              }}>
              <Text py={3} color="black" fontSize={fontSize ? fontSize : ""}>
                {customLabel ? customLabel : "Open App"}
              </Text>
            </Button>
          </Tooltip>
        </Box>
      ) : (
        <Box h="32px" my="2" />
      )}
    </>
  );
}
