import React from "react";
import { Flex, useColorMode } from "@chakra-ui/react";
import Dashboard from "components/Dashboard";

const LandingPage = ({
  onShowConnectWalletModal,
  handleLogout,
  onRemoteTriggerOfBiTzPlayModel,
}: {
  onShowConnectWalletModal?: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel?: any;
}) => {
  const { colorMode } = useColorMode();

  return (
    <Flex bgColor={colorMode === "dark" ? "bgDark" : "white"} flexDirection="column" justifyContent="space-between" zIndex={2}>
      <Dashboard
        onShowConnectWalletModal={onShowConnectWalletModal}
        handleLogout={handleLogout}
        onRemoteTriggerOfBiTzPlayModel={onRemoteTriggerOfBiTzPlayModel}
      />
    </Flex>
  );
};

export default LandingPage;
