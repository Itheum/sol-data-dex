import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Modal,
  Heading,
  Button,
  Text,
  Alert,
  AlertIcon,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  useBreakpointValue,
  useDisclosure,
  useColorMode,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import nfMeIDVault from "assets/img/nfme/nfme-id-avatar.png";
import ShortAddress from "components/UtilComps/ShortAddress";
import { checkIfFreeDataNftGiftMinted, mintMiscDataNft, getOrCacheAccessNonceAndSignature } from "libs/Solana/utils";
import { sleep } from "libs/utils/util";
import { useAccountStore } from "store/account";
import { LuFlaskRound } from "react-icons/lu";
import { BsDot } from "react-icons/bs";
import Countdown from "components/CountDown";

const Dashboard = ({
  onShowConnectWalletModal,
  handleLogout,
  onRemoteTriggerOfBiTzPlayModel,
}: {
  onShowConnectWalletModal?: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel?: any;
}) => {
  const navigate = useNavigate();
  const { connected: isSolWalletConnected } = useWallet();
  const { publicKey: solPubKey, signMessage } = useWallet();
  const isUserLoggedIn = solPubKey ? true : false;
  const modelSize = useBreakpointValue({ base: "xs", md: "xl" });
  const { isOpen: isProgressModalOpen, onOpen: onProgressModalOpen, onClose: onProgressModalClose } = useDisclosure();
  const { colorMode } = useColorMode();
  const [freeNfMeIdClaimed, setFreeNfMeIdClaimed] = useState<boolean>(false);
  const [freeBitzClaimed, setFreeBitzClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeDropCheckNeededForBitz, setFreeDropCheckNeededForBitz] = useState<number>(0);
  const [freeDropCheckNeededForMusicGift, setFreeDropCheckNeededForMusicGift] = useState<number>(0);
  const [errFreeMintGeneric, setErrFreeMintGeneric] = useState<any>(null);

  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);

  const bitzBalance = useAccountStore((state) => state.bitzBalance);
  const cooldown = useAccountStore((state) => state.cooldown);

  useEffect(() => {
    const checkFreeClaims = async () => {
      if (solPubKey) {
        setFreeDropCheckLoading(true);
        const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", solPubKey.toBase58());

        if (freeNfMeIdMinted.alreadyGifted) {
          setFreeNfMeIdClaimed(true);
        }

        await sleep(1);

        const freeBitzMinted = await checkIfFreeDataNftGiftMinted("bitzxp", solPubKey.toBase58());

        if (freeBitzMinted.alreadyGifted) {
          setFreeBitzClaimed(true);
        }

        await sleep(1);

        const freeMusicGiftMinted = await checkIfFreeDataNftGiftMinted("musicgift", solPubKey.toBase58());

        if (freeMusicGiftMinted.alreadyGifted) {
          setFreeMusicGiftClaimed(true);
        }

        setFreeDropCheckLoading(false);
      }
    };

    checkFreeClaims();
  }, [solPubKey]);

  useEffect(() => {
    const checkFreeClaim = async () => {
      if (solPubKey) {
        setFreeDropCheckLoading(true);

        const freeDataNftMinted = await checkIfFreeDataNftGiftMinted("bitzxp", solPubKey.toBase58());

        if (freeDataNftMinted.alreadyGifted) {
          setFreeBitzClaimed(true);
        }

        await sleep(1);

        setFreeDropCheckLoading(false);
      }
    };

    checkFreeClaim();
  }, [freeDropCheckNeededForBitz]);

  useEffect(() => {
    const checkFreeClaim = async () => {
      if (solPubKey) {
        setFreeDropCheckLoading(true);

        const freeDataNftMinted = await checkIfFreeDataNftGiftMinted("musicgift", solPubKey.toBase58());

        if (freeDataNftMinted.alreadyGifted) {
          setFreeMusicGiftClaimed(true);
        }

        await sleep(1);

        setFreeDropCheckLoading(false);
      }
    };

    checkFreeClaim();
  }, [freeDropCheckNeededForMusicGift]);

  const handleProgressModalClose = () => {
    setFreeDropCheckLoading(false);
    setErrFreeMintGeneric(null);

    onProgressModalClose();
  };

  const handleFreeMint = async (mintTemplate: string) => {
    if (!solPubKey) {
      return;
    }

    onProgressModalOpen();
    await sleep(1);

    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage,
      publicKey: solPubKey,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    const miscMintRes = await mintMiscDataNft(mintTemplate, solPubKey.toBase58(), usedPreAccessSignature, usedPreAccessNonce);

    if (miscMintRes.error) {
      setErrFreeMintGeneric(miscMintRes.error || miscMintRes?.e?.toString() || "unknown error");
    } else if (miscMintRes?.newDBLogEntryCreateFailed) {
      setErrFreeMintGeneric("Misc mint passed, but the db log failed");
    }

    if (miscMintRes?.assetId) {
      await sleep(1);

      switch (mintTemplate) {
        case "nfmeid":
          setFreeDropCheckNeededForBitz(freeDropCheckNeededForBitz + 1);
          break;
        case "musicgift":
          setFreeDropCheckNeededForMusicGift(freeDropCheckNeededForMusicGift + 1);
          break;
        default:
          break;
      }

      onProgressModalClose();
    }
  };

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection={["column", null, "column"]} alignItems="center" justifyContent="center">
      <Box width={"100%"} backgroundColor={"blue.900"} padding={5}>
        <Heading>Hello Human,</Heading>
        <Heading>Join the AI Workforce, prove your reputation, co-create data with me and get rewarded</Heading>
      </Box>
      <Box width={"100%"} height="300px" backgroundColor={"blue.800"} minH={"500px"} padding={5}>
        <Flex backgroundColor={"blue.700"} flexDirection={["column", null, "row"]} gap={2} minH={"90%"}>
          <Box backgroundColor={"green.700"} flex="1">
            <Heading as="h2" size="lg" textAlign={"center"} mb={5}>
              Get Started
            </Heading>

            <Flex flexDirection={["column", null, "column"]} gap="3">
              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Connect Solana Wallet
                </Heading>
                <Text>You need this to collect your rewards</Text>

                {!isUserLoggedIn ? (
                  <>
                    <Button
                      colorScheme="teal"
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      onClick={() => {
                        onShowConnectWalletModal("sol");
                      }}>
                      Connect Wallet
                    </Button>
                  </>
                ) : (
                  <Box>
                    ✅
                    <ShortAddress address={solPubKey?.toBase58()} fontSize="xl" isCopyAddress={true} />
                  </Box>
                )}
              </Box>

              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Get Free NFMe ID
                </Heading>
                <Text>You can use it as your web3 identity for AI agents to verify</Text>
                <Box>
                  <Button
                    colorScheme="teal"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    isDisabled={freeNfMeIdClaimed}
                    onClick={() => {
                      onProgressModalOpen();
                    }}>
                    {freeNfMeIdClaimed ? "Claimed" : "Free Mint Now"}
                  </Button>
                </Box>
                <Text fontSize="xs">
                  Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which wont be used by is to make sure your wallet
                  can received the NFT
                </Text>
              </Box>

              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Get Free BiTz XP Data NFT
                </Heading>
                <Text>You can use it to grow XP by staying active</Text>
                <Box>
                  <Button
                    colorScheme="teal"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    isDisabled={freeBitzClaimed}
                    onClick={() => {
                      handleFreeMint("bitzxp");
                    }}>
                    {freeBitzClaimed ? "Claimed" : "Free Mint Now"}
                  </Button>
                </Box>
                <Text fontSize="xs">
                  Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which wont be used by is to make sure your wallet
                  can received the NFT
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box backgroundColor={"green.700"} flex="1">
            <Heading as="h2" size="lg" textAlign={"center"} mb={5}>
              Grow Reputation
            </Heading>

            <Flex flexDirection={["column", null, "column"]} gap="3">
              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Proof of Activity
                </Heading>
                <Text>Prove that you are active</Text>
                <Button display={{ base: "none", md: "inline-flex" }} size={{ md: "md", xl: "md", "2xl": "lg" }} p="2 !important">
                  {bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}
                  <LuFlaskRound fontSize={"1.4rem"} fill="#38bdf8" />

                  {cooldown <= 0 && cooldown != -2 && (
                    <>
                      {" "}
                      <Box
                        position={"absolute"}
                        w={"full"}
                        h={"full"}
                        right="-15px"
                        top="-15px"
                        as={BsDot}
                        color="#38bdf8"
                        size="15px"
                        animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"></Box>{" "}
                      <Box
                        position={"absolute"}
                        w={"full"}
                        h={"full"}
                        right="-8px"
                        top="-18px"
                        as={BsDot}
                        color="#38bdf8"
                        size="15px"
                        animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
                        style={{ animationDelay: "0.5s" }}></Box>{" "}
                      <Box
                        position={"absolute"}
                        w={"full"}
                        h={"full"}
                        right="-12px"
                        top="-25px"
                        as={BsDot}
                        color="#38bdf8"
                        size="55px"
                        animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
                        style={{ animationDelay: "1s" }}></Box>{" "}
                    </>
                  )}
                </Button>
                <Box>
                  <Button
                    onClick={() => onRemoteTriggerOfBiTzPlayModel(true)}
                    variant="outline"
                    borderColor="#38bdf8"
                    rounded="full"
                    w="full"
                    _hover={{ backgroundImage: "linear-gradient(345deg, #171717, #38bdf8)" }}>
                    <span>
                      {cooldown === -2 ? (
                        <span>Check XP Balance & Play</span>
                      ) : cooldown > 0 ? (
                        <Countdown unixTime={cooldown} />
                      ) : (
                        <span> Claim Your {`<BiTz>`} XP</span>
                      )}
                    </span>
                  </Button>
                  <Text>Buy BiTz</Text>
                </Box>
              </Box>

              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Proof of Reputation
                </Heading>
                <Text>Bond ITHEUM on your NFMe ID vault, and grow your Liveliness to signal that you are {"Committed"}</Text>
                <Box>
                  <Button
                    colorScheme="teal"
                    variant="outline"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    onClick={() => {
                      navigate("/liveliness");
                    }}>
                    Bond ITHEUM on your NFMe ID
                  </Button>
                  <Button
                    colorScheme="teal"
                    variant="outline"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    onClick={() => {
                      navigate("/liveliness");
                    }}>
                    Boost your Liveliness
                  </Button>
                </Box>
              </Box>
            </Flex>
          </Box>
          <Box backgroundColor={"green.700"} flex="1">
            <Heading as="h2" size="lg" textAlign={"center"} mb={5}>
              Do Work
            </Heading>

            <Flex flexDirection={["column", null, "column"]} gap="3">
              <Box backgroundColor={"gray.500"}>
                <Text>The following jobs are live</Text>

                <Heading as="h3" size="md" textAlign={"center"}>
                  NF-Tunes AI Music Feedback
                </Heading>
                <Text>Help real-world music artists improve their content using AI tools</Text>
              </Box>

              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Get Free Music Data NFT
                </Heading>
                <Text>Claim it and use it on NF-Tunes</Text>
                <Box>
                  <Text>
                    <Button
                      colorScheme="teal"
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={freeMusicGiftClaimed}
                      onClick={() => {
                        handleFreeMint("musicgift");
                      }}>
                      {freeMusicGiftClaimed ? "Claimed" : "Free Mint Now"}
                    </Button>
                  </Text>

                  <Button
                    colorScheme="teal"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    isDisabled={!freeMusicGiftClaimed}
                    onClick={() => {
                      window.open("https://explorer.ithuem.io/nftunes", "_blank");
                    }}>
                    Listen on NF-Tunes
                  </Button>
                </Box>
              </Box>

              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Signal Feedback
                </Heading>
                <Text>Signal your feedback by gifting BiTz points</Text>
                <Box>
                  <Text>Gift BiTz XP on NF-Tunes</Text>
                </Box>
              </Box>
            </Flex>
          </Box>
          <Box backgroundColor={"green.700"} flex="1">
            <Heading as="h2" size="lg" textAlign={"center"} mb={5}>
              Share Rewards
            </Heading>

            <Flex flexDirection={["column", null, "column"]} gap="3">
              <Box backgroundColor={"gray.500"}>
                <Heading as="h3" size="md" textAlign={"center"}>
                  Liveliness Staking Rewards
                </Heading>
                <Text>Get a share of protocol rewards. Currently 40% APR</Text>
                <Box>
                  <Button
                    colorScheme="teal"
                    variant="outline"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    onClick={() => {
                      navigate("/liveliness");
                    }}>
                    Top-up your bond for more rewards
                  </Button>

                  <Button
                    colorScheme="teal"
                    variant="outline"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    isLoading={freeDropCheckLoading}
                    onClick={() => {
                      navigate("/liveliness");
                    }}>
                    Claim Rewards
                  </Button>
                </Box>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Box>

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
          <ModalHeader mt={5}>Working...</ModalHeader>
          <ModalBody pb={6}>
            {errFreeMintGeneric && (
              <Alert status="error" mt={5} rounded="md" mb={8}>
                <AlertIcon />
                <Box>
                  <Text>{errFreeMintGeneric} </Text>
                </Box>
              </Alert>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Dashboard;
