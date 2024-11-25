import React from "react";
import { Box, Center, Flex, Heading, Image, Text, useColorMode } from "@chakra-ui/react";
import imgHeroDataNFTs from "assets/img/landing/hero-data-nfts.png";
import imgHeroMetaverseMask from "assets/img/landing/hero-metaverse-mask.png";
import NewCreatorCTA from "components/NewCreatorCTA";
import NFMeIdCTA from "components/NFMeIdCTA";
import ExplainerArticles from "components/Sections/ExplainerArticles";
import Dashboard from "components/Dashboard";

const LandingPage = ({ onShowConnectWalletModal, handleLogout }: { onShowConnectWalletModal?: any; handleLogout: any }) => {
  const { colorMode } = useColorMode();
  let containerShadow = "rgb(255 255 255 / 16%) 0px 10px 36px 0px, rgb(255 255 255 / 6%) 0px 0px 0px 1px";

  if (colorMode === "light") {
    containerShadow = "rgb(0 0 0 / 16%) 0px 10px 36px 0px, rgb(0 0 0 / 6%) 0px 0px 0px 1px";
  }

  return (
    <Box>
      <Flex bgColor={colorMode === "dark" ? "bgDark" : "white"} flexDirection="column" justifyContent="space-between" minH="100vh" zIndex={2}>
        <Dashboard onShowConnectWalletModal={onShowConnectWalletModal} handleLogout={handleLogout} />
      </Flex>
    </Box>
  );
};

export default LandingPage;
