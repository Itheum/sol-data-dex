import React, { useEffect } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Stack,
  Box,
  Text,
  Link,
  Wrap,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  WrapItem,
  useToast,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { WALLETS, SOL_ENV_ENUM } from "libs/config";
import { useLocalStorage } from "libs/hooks";
import { gtagGo, getApiDataDex } from "libs/utils";

/* 
we use global vars here so we can maintain this state across routing back and forth to this unlock page
these vars are used to detect a "new login", i.e a logged out user logged in. we can use this to enable
"user accounts" type activity, i.e. check if its a new user or returning user etc
*/
let solGotConnected = false;

function ModalAuthPicker({ openConnectModal }: { openConnectModal: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { publicKey: solPubKey } = useWallet();
  const addressSol = solPubKey?.toBase58();
  const { isOpen: isProgressModalOpen, onOpen: onProgressModalOpen, onClose: onProgressModalClose } = useDisclosure();
  const [, setWalletUsedSession] = useLocalStorage("itm-wallet-used", null);
  const { colorMode } = useColorMode();
  const modelSize = useBreakpointValue({ base: "xs", md: "xl" });
  const toast = useToast();

  useEffect(() => {
    console.log("==== effect for addressSol. addressSol = ", addressSol);

    if (!addressSol) {
      solGotConnected = false;
    } else {
      if (!solGotConnected) {
        // the user came to the unlock page without a solana connection and then connected a wallet,
        // ... i.e a non-logged in user, just logged in using SOL
        console.log("==== User JUST logged in with addressSol = ", addressSol);

        // redirect user to the dashboard if there are from home or other certain routes
        if (pathname === "/") {
          navigate("/dashboard");
        } else if (pathname === "/NFMeID") {
          navigate("/liveliness");
        }

        const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
        logUserLoggedInInUserAccounts(addressSol, chainId);
      }

      solGotConnected = true;
    }
  }, [addressSol]);

  useEffect(() => {
    if (openConnectModal) {
      onProgressModalOpen();
    }
  }, [openConnectModal]);

  const handleProgressModalClose = () => {
    onProgressModalClose();
  };

  const goWalletLogin = (wallet: any) => {
    gtagGo("auth", "login", wallet);

    setWalletUsedSession(wallet);
  };

  const logUserLoggedInInUserAccounts = async (addr: string, chainId: string) => {
    try {
      const callRes = await axios.post(`${getApiDataDex()}/userAccounts/userLoggedIn`, {
        addr,
        chainId,
      });

      const userLoggedInCallData = callRes.data;

      if (userLoggedInCallData?.error) {
        console.error("User account login call failed");
      } else {
        const celebrateEmojis = ["🥳", "🎊", "🍾", "🥂", "🍻", "🍾"];

        if (userLoggedInCallData?.newUserAccountCreated) {
          toast({
            title: `${celebrateEmojis[Math.floor(Math.random() * celebrateEmojis.length)]} Welcome New User! Its Great To Have You Here.`,
            status: "success",
            isClosable: true,
          });
        } else if (userLoggedInCallData?.existingUserAccountLastLoginUpdated) {
          let userMessage = "";

          userMessage = "Welcome Back Solana Legend!";

          toast({
            title: `${celebrateEmojis[Math.floor(Math.random() * celebrateEmojis.length)]} ${userMessage}`,
            status: "success",
            isClosable: true,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {isProgressModalOpen && (
        <Modal
          isCentered
          size={modelSize}
          isOpen={isProgressModalOpen}
          onClose={handleProgressModalClose}
          closeOnEsc={false}
          closeOnOverlayClick={false}
          blockScrollOnMount={false}>
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
            <ModalCloseButton />
            <ModalHeader mt={5}>
              Select a{" "}
              <Badge mb="1" mr="1" ml="1" variant="outline" fontSize="0.8em" colorScheme="teal">
                {import.meta.env.VITE_ENV_NETWORK}
              </Badge>{" "}
              Solana Wallet
            </ModalHeader>
            <ModalBody pb={6}>
              <Stack spacing="5">
                <Box p="5px">
                  <Stack>
                    <Wrap spacing="20px" justify="space-around" padding="10px">
                      <WrapItem
                        onClick={() => {
                          goWalletLogin(WALLETS.SOLANA);
                          onProgressModalClose();
                        }}>
                        <WalletMultiButton tabIndex={2} style={{ padding: "31px" }} />
                      </WrapItem>
                    </Wrap>
                  </Stack>
                </Box>

                <Text fontSize="sm">
                  By logging in, you are agreeing to the{" "}
                  <Link href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/terms-of-use" isExternal>
                    Terms of Use <ExternalLinkIcon mx="2px" />
                  </Link>{" "}
                  &{" "}
                  <Link href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/privacy-policy" isExternal>
                    Privacy Policy <ExternalLinkIcon mx="2px" />
                  </Link>
                </Text>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default ModalAuthPicker;
