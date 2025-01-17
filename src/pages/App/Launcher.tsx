import React, { useState } from "react";
import { Container, Flex, useColorMode } from "@chakra-ui/react";
import { TermsChangedNoticeModal } from "components/TermsChangedNoticeModal";
import { SolContextProvider } from "contexts/sol/SolContextProvider";
import { useLocalStorage } from "libs/hooks";
import { clearAppSessionsLaunchMode } from "libs/utils";
import { StoreProvider } from "store/StoreProvider";
import App from "./App";
import ModalAuthPicker from "./ModalAuthPicker";

function Launcher() {
  const [launchModeSession, setLaunchModeSession] = useLocalStorage("itm-launch-mode", null);
  const [launchMode, setLaunchMode] = useState(launchModeSession || "no-auth");
  const [openConnectModal, setOpenConnectModal] = useState(false);

  const { colorMode } = useColorMode();
  let containerShadow = "rgb(255 255 255 / 16%) 0px 10px 36px 0px, rgb(255 255 255 / 6%) 0px 0px 0px 1px";

  if (colorMode === "light") {
    containerShadow = "rgb(0 0 0 / 16%) 0px 10px 36px 0px, rgb(0 0 0 / 6%) 0px 0px 0px 1px";
  }
  // hoisting launchModeControl here allows us to go multi-chain easier in future
  // ... have a look at git history on this component
  const handleLaunchMode = (chainOption: string) => {
    if (chainOption == "no-auth") {
      setOpenConnectModal(false);
    } else {
      setOpenConnectModal(true);
    }

    setLaunchMode(chainOption);
    setLaunchModeSession(chainOption);

    // resetting all launch mode sessions here is nice and clean
    clearAppSessionsLaunchMode();
  };

  return (
    <>
      <SolContextProvider>
        <StoreProvider>
          <Container maxW="97.5rem">
            <Flex
              bgColor={colorMode === "dark" ? "bgDark" : "bgWhite"}
              flexDirection="column"
              justifyContent="space-between"
              minH="100svh"
              boxShadow={containerShadow}
              zIndex={2}>
              <ModalAuthPicker openConnectModal={openConnectModal} onShowConnectWalletModal={handleLaunchMode} />
              <App onShowConnectWalletModal={handleLaunchMode} />
            </Flex>
          </Container>
        </StoreProvider>
      </SolContextProvider>
      <TermsChangedNoticeModal />
    </>
  );
}

export default Launcher;
