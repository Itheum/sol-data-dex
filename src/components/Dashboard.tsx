import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Modal,
  Heading,
  Button,
  Text,
  Image,
  Alert,
  AlertIcon,
  Spinner,
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
import { BsDot } from "react-icons/bs";
import { BsBookmarkCheckFill } from "react-icons/bs";
import { LuFlaskRound } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import nfMeIDVault from "assets/img/nfme/nfme-id-avatar.png";
import Countdown from "components/CountDown";
import ShortAddress from "components/UtilComps/ShortAddress";
import { checkIfFreeDataNftGiftMinted, mintMiscDataNft, getOrCacheAccessNonceAndSignature, fetchSolNfts } from "libs/Solana/utils";
import { sleep } from "libs/utils/util";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";

const Dashboard = ({
  onShowConnectWalletModal,
  onRemoteTriggerOfBiTzPlayModel,
}: {
  onShowConnectWalletModal?: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel?: any;
}) => {
  const navigate = useNavigate();
  const { publicKey: userPublicKey, signMessage } = useWallet();
  const isUserLoggedIn = userPublicKey ? true : false;
  const modelSize = useBreakpointValue({ base: "xs", md: "xl" });
  const { isOpen: isProgressModalOpen, onOpen: onProgressModalOpen, onClose: onProgressModalClose } = useDisclosure();
  const { colorMode } = useColorMode();
  const [freeMintLoading, setFreeMintLoading] = useState<boolean>(false);
  const [freeNfMeIdClaimed, setFreeNfMeIdClaimed] = useState<boolean>(false);
  const [freeBitzClaimed, setFreeBitzClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeDropCheckNeededForBitz, setFreeDropCheckNeededForBitz] = useState<number>(0);
  const [freeDropCheckNeededForMusicGift, setFreeDropCheckNeededForMusicGift] = useState<number>(0);
  const [errFreeMintGeneric, setErrFreeMintGeneric] = useState<string | null>(null);
  const bitzBalance = useAccountStore((state) => state.bitzBalance);
  const cooldown = useAccountStore((state) => state.cooldown);
  const { updateAllDataNfts } = useNftsStore();

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  useEffect(() => {
    const checkFreeClaims = async () => {
      if (userPublicKey) {
        setFreeDropCheckLoading(true);
        const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", userPublicKey.toBase58());

        if (freeNfMeIdMinted.alreadyGifted) {
          setFreeNfMeIdClaimed(true);
        }

        await sleep(1);

        const freeBitzMinted = await checkIfFreeDataNftGiftMinted("bitzxp", userPublicKey.toBase58());

        if (freeBitzMinted.alreadyGifted) {
          setFreeBitzClaimed(true);
        }

        await sleep(1);

        const freeMusicGiftMinted = await checkIfFreeDataNftGiftMinted("musicgift", userPublicKey.toBase58());

        if (freeMusicGiftMinted.alreadyGifted) {
          setFreeMusicGiftClaimed(true);
        }

        setFreeDropCheckLoading(false);
      }
    };

    checkFreeClaims();
  }, [userPublicKey]);

  useEffect(() => {
    const checkFreeClaim = async () => {
      if (userPublicKey) {
        setFreeDropCheckLoading(true);

        const freeDataNftMinted = await checkIfFreeDataNftGiftMinted("bitzxp", userPublicKey.toBase58());

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
      if (userPublicKey) {
        setFreeDropCheckLoading(true);

        const freeDataNftMinted = await checkIfFreeDataNftGiftMinted("musicgift", userPublicKey.toBase58());

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
    setFreeMintLoading(false);
    onProgressModalClose();
  };

  const handleFreeMint = async (mintTemplate: string) => {
    if (!userPublicKey) {
      return;
    }

    setFreeMintLoading(true);
    onProgressModalOpen();
    await sleep(1);

    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage,
      publicKey: userPublicKey,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    const miscMintRes = await mintMiscDataNft(mintTemplate, userPublicKey.toBase58(), usedPreAccessSignature, usedPreAccessNonce);

    if (miscMintRes.error) {
      setErrFreeMintGeneric(miscMintRes.error || miscMintRes?.e?.toString() || "unknown error");
    } else if (miscMintRes?.newDBLogEntryCreateFailed) {
      setErrFreeMintGeneric("Misc mint passed, but the db log failed");
    }

    if (miscMintRes?.assetId) {
      // check 10 seconds and check if the API in the backend to mark the free mint as done
      await sleep(10);

      switch (mintTemplate) {
        case "bitzxp":
          setFreeDropCheckNeededForBitz(freeDropCheckNeededForBitz + 1);
          break;
        case "musicgift":
          setFreeDropCheckNeededForMusicGift(freeDropCheckNeededForMusicGift + 1);
          break;
        default:
          break;
      }

      // update the NFT store now as we have a new NFT
      fetchSolNfts(userPublicKey?.toBase58()).then((nfts) => {
        updateAllDataNfts(nfts);
      });

      onProgressModalClose();
    } else {
      setErrFreeMintGeneric("Free minting has failed");
    }

    setFreeMintLoading(false);
  };

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection="column" alignItems="center" justifyContent="center" backgroundColor={"xred.800"}>
      <Box width={"100%"} backgroundColor={"xblue.900"} padding={5} textAlign="center">
        <Heading as="h1" size="xl" fontFamily="Satoshi-Regular">
          Hello Human,
        </Heading>
        <Heading as="h1" size="lg" fontFamily="Satoshi-Regular">
          Join the AI Data Workforce, prove your reputation, co-create data with me and get rewarded
        </Heading>
        <Image hidden margin="auto" boxSize="auto" w={{ base: "60%", md: "50%" }} src={nfMeIDVault} alt="Data NFTs Illustration" />
      </Box>
      <Box width={"100%"} backgroundColor={"xblue.800"} minH="400px" padding={5}>
        <Flex backgroundColor={"xblue.700"} flexDirection={["column", null, "row"]} gap={2} minH="90%">
          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Get Started for Free
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                <Heading as="h3" size="md" textAlign="center" fontFamily="Satoshi-Regular">
                  Connect Your Wallet
                </Heading>

                <Text textAlign="center">You need this to collect your rewards</Text>

                {!isUserLoggedIn ? (
                  <Button
                    m="auto"
                    colorScheme="teal"
                    fontSize={{ base: "sm", md: "md" }}
                    size={{ base: "sm", lg: "lg" }}
                    onClick={() => {
                      onShowConnectWalletModal("sol");
                    }}>
                    Connect Wallet
                  </Button>
                ) : (
                  <Flex flexDirection="column" alignItems="center">
                    <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                    <Box>
                      <ShortAddress address={userPublicKey?.toBase58()} fontSize="xl" isCopyAddress={true} />
                    </Box>
                  </Flex>
                )}
              </Flex>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                <Heading as="h3" size="md" textAlign="center">
                  Get a Free NFMe ID
                </Heading>

                <Text textAlign="center">You can use it as your web3 identity for AI agents to verify</Text>

                <Button
                  m="auto"
                  colorScheme="teal"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || freeNfMeIdClaimed}
                  onClick={() => {
                    navigate("/mintdata?launchTemplate=nfMeIdFreeMint");
                  }}>
                  {freeNfMeIdClaimed ? "Claimed" : "Free Mint Now"}
                </Button>

                {!freeNfMeIdClaimed ? (
                  <Text fontSize="xs" textAlign="center">
                    Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure your
                    wallet exists and can receive the NFT.
                  </Text>
                ) : (
                  <Box margin="auto">
                    <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                  </Box>
                )}
              </Flex>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2}>
                <Heading as="h3" size="md" textAlign="center">
                  Get a Free BiTz XP Data NFT
                </Heading>

                <Text textAlign="center">You can use it to grow XP by staying active</Text>

                <Button
                  m="auto"
                  colorScheme="teal"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || freeBitzClaimed}
                  onClick={() => {
                    handleFreeMint("bitzxp");
                  }}>
                  {freeBitzClaimed ? "Claimed" : "Free Mint Now"}
                </Button>

                {!freeBitzClaimed ? (
                  <Text fontSize="xs" textAlign="center">
                    Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure your
                    wallet exists and can receive the NFT.
                  </Text>
                ) : (
                  <Box margin="auto">
                    <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                  </Box>
                )}
              </Flex>
            </Flex>
          </Box>

          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Grow Reputation
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                <Heading as="h3" size="md" textAlign="center">
                  Boost Your Proof-of-Activity
                </Heading>

                <Text textAlign="center">You need BiTz to vote to curate AI content. Earn BiTz by playing the game every few hours.</Text>

                <Button
                  m="auto"
                  display={{ base: "none", md: "inline-flex" }}
                  size={{ md: "md", xl: "md", "2xl": "lg" }}
                  p="8 !important"
                  isDisabled={!isUserLoggedIn}>
                  <Text fontSize="xl">{bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}</Text>

                  <LuFlaskRound fontSize={"2.2rem"} fill="#03c797" />

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
                        color="#03c797"
                        size="15px"
                        animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"></Box>{" "}
                      <Box
                        position={"absolute"}
                        w={"full"}
                        h={"full"}
                        right="-8px"
                        top="-18px"
                        as={BsDot}
                        color="#03c797"
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
                        color="#03c797"
                        size="55px"
                        animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
                        style={{ animationDelay: "1s" }}></Box>{" "}
                    </>
                  )}
                </Button>

                {isUserLoggedIn && (
                  <Button
                    m="auto"
                    onClick={() => onRemoteTriggerOfBiTzPlayModel(true)}
                    variant="outline"
                    borderColor="#03c797"
                    rounded="full"
                    w="full"
                    _hover={{ textColor: "white", backgroundImage: "linear-gradient(345deg, #171717, #03c797)" }}>
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
                )}

                <Button
                  m="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isDisabled={!isUserLoggedIn}
                  onClick={() => {
                    alert("Buy BiTz");
                  }}>
                  Buy BiTz
                </Button>
              </Flex>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2}>
                <Heading as="h3" size="md" textAlign="center">
                  Boost Your Proof-of-Reputation
                </Heading>

                <Text textAlign="center">Bond ITHEUM on your NFMe ID vault, and grow your Liveliness to signal that you are {"Committed"}</Text>

                <Button
                  m="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn}
                  onClick={() => {
                    navigate("/datanfts/unbonded");
                  }}>
                  Bond ITHEUM on your NFMe ID
                </Button>
                <Button
                  m="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn}
                  onClick={() => {
                    navigate("/liveliness");
                  }}>
                  Boost your bond for Staking Rewards
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Co-Create with AI
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Text textAlign="center" fontSize="lg" fontWeight="bold">
                {`<< `}The Following Jobs Are Live{` >>`}
              </Text>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                <Heading as="h3" size="md" textAlign="center">
                  NF-Tunes AI Music Feedback
                </Heading>
                <Text textAlign="center">Help real-world music artists amplify their music using AI tools</Text>
              </Flex>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                <Text textAlign="center" fontSize="2xl">
                  1.
                </Text>
                <Heading as="h3" size="md" textAlign="center">
                  Get Free Music Data NFT
                </Heading>

                <Text textAlign="center">Claim it and use it on NF-Tunes</Text>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || freeMusicGiftClaimed}
                  w="280px"
                  onClick={() => {
                    handleFreeMint("musicgift");
                  }}>
                  {freeMusicGiftClaimed ? "Claimed" : "Free Mint Now"}
                </Button>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || !freeMusicGiftClaimed}
                  onClick={() => {
                    window.open("https://explorer.itheum.io/nftunes", "_blank");
                  }}>
                  Use Music Data NFT on NF-Tunes
                </Button>
              </Flex>

              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2}>
                <Text textAlign="center" fontSize="2xl">
                  2.
                </Text>
                <Heading as="h3" size="md" textAlign="center">
                  Signal Feedback
                </Heading>

                <Text textAlign="center">Share your feedback by gifting BiTz points to content you like</Text>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || !freeMusicGiftClaimed}
                  w="280px"
                  onClick={() => {
                    window.open("https://explorer.itheum.io/nftunes", "_blank");
                  }}>
                  Gift BiTz XP on NF-Tunes
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Share Rewards
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2}>
                <Heading as="h3" size="md" textAlign="center">
                  Liveliness Staking Rewards
                </Heading>

                <Text textAlign="center">Get a share of protocol rewards. Currently 40% APR on your NFMe Id Bonds</Text>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn}
                  w="280px"
                  onClick={() => {
                    navigate("/liveliness");
                  }}>
                  Top-up your bond for more rewards
                </Button>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn}
                  onClick={() => {
                    navigate("/liveliness");
                  }}>
                  Claim Rewards
                </Button>
              </Flex>
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
          {!freeMintLoading && <ModalCloseButton />}
          <ModalHeader mt={5} textAlign="center">
            Free Mint in Progress
          </ModalHeader>
          <ModalBody pb={6}>
            {freeMintLoading && (
              <Flex w="100%" h="5rem" justifyContent="center" alignItems="center">
                <Spinner size="xl" color="teal.200" />
              </Flex>
            )}
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
