import React from "react";
import { Box, Button, Flex, Heading, SimpleGrid, Spacer, Stack, Text, useBreakpointValue, useColorMode } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import liveliness from "assets/img/nfme/liveliness.png";
import myNFMe from "assets/img/nfme/nfme-data-nft-token.png";
import illustration from "assets/img/whitelist/getWhitelist.png";
import NewCreatorCTA from "components/NewCreatorCTA";
import NFMeIdCTA from "components/NFMeIdCTA";
import Dashboard from "../../components/Dashboard";

export default function MyHome({
  setMenuItem,
  onShowConnectWalletModal,
  handleLogout,
  onRemoteTriggerOfBiTzPlayModel,
}: {
  setMenuItem: any;
  onShowConnectWalletModal?: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel?: any;
}) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const tileBoxW = "310px";
  const heroGridMargin = useBreakpointValue({ base: "auto", md: "initial" });

  return (
    <>
      <Stack>
        <Dashboard
          onShowConnectWalletModal={onShowConnectWalletModal}
          handleLogout={handleLogout}
          onRemoteTriggerOfBiTzPlayModel={onRemoteTriggerOfBiTzPlayModel}
        />
      </Stack>
    </>
  );
}
