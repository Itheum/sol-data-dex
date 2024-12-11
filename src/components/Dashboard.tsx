import React, { useState, useEffect, useRef } from "react";
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
  Badge,
} from "@chakra-ui/react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { BsDot, BsChevronDoubleDown } from "react-icons/bs";
import { BsBookmarkCheckFill } from "react-icons/bs";
import { LuFlaskRound } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import MusicGiftPreview from "assets/img/music-data-nft-gift-preview.png";
import nfMeIDVault from "assets/img/nfme/nfme-id-avatar.png";
import Countdown from "components/CountDown";
import ShortAddress from "components/UtilComps/ShortAddress";
import { EXPLORER_APP_FOR_TOKEN } from "libs/config";
import { SolEnvEnum } from "libs/Solana/config";
import { checkIfFreeDataNftGiftMinted, mintMiscDataNft, getOrCacheAccessNonceAndSignature, fetchSolNfts } from "libs/Solana/utils";
import { sleep } from "libs/utils/util";
import { useAccountStore } from "store/account";
import { useMintStore } from "store/mint";
import { useNftsStore } from "store/nfts";
import BadgesPreview from "./Dashboard/BadgesPreview";
import { NFMeIDMintModal } from "./Dashboard/NFMeIDMintModal";

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "10rem" },
};

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
  const [freeMintBitzXpIntroToAction, setFreeMintBitzXpIntroToAction] = useState<boolean>(false);
  const [freeMintBitzXpLoading, setFreeMintBitzXpLoading] = useState<boolean>(false);
  const [freeMintBitzXpGameComingUp, setFreeMintBitzXpGameComingUp] = useState<boolean>(false);
  const [freeBitzClaimed, setFreeBitzClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeMintMusicGiftIntroToAction, setFreeMintMusicGiftIntroToAction] = useState<boolean>(false);
  const [freeMintMusicGiftLoading, setFreeMintMusicGiftLoading] = useState<boolean>(false);
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeDropCheckNeededForBitz, setFreeDropCheckNeededForBitz] = useState<number>(0);
  const [freeDropCheckNeededForMusicGift, setFreeDropCheckNeededForMusicGift] = useState<number>(0);
  const [errFreeMintGeneric, setErrFreeMintGeneric] = useState<string | null>(null);
  const bitzBalance = useAccountStore((state) => state.bitzBalance);
  const cooldown = useAccountStore((state) => state.cooldown);
  const { updateAllDataNfts, bondedDataNftIds, bitzDataNfts, userHasG2BiTzNft } = useNftsStore();
  const { usersNfMeIdVaultBondId, updateFreeNfMeIdClaimed, freeNfMeIdClaimed, currentMaxApr } = useMintStore();
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SolEnvEnum.devnet : SolEnvEnum.mainnet;

  // conditional displays
  const [hasBitzNft, setHasBitzNft] = useState(false);
  const [hasUnclaimedBadges, setHasUnclaimedBadges] = useState(false);
  const [isNFMeIDModalOpen, setIsNFMeIDModalOpen] = useState(false);

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  const helloHeadingRef = useRef<HTMLHeadingElement>(null);

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const checkFreeClaims = async () => {
      if (userPublicKey) {
        setFreeDropCheckLoading(true);
        const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", userPublicKey.toBase58());

        if (freeNfMeIdMinted.alreadyGifted) {
          updateFreeNfMeIdClaimed(true);
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

  useEffect(() => {
    if (bitzDataNfts.length > 0) {
      setHasBitzNft(true);
    }
  }, [bitzDataNfts]);

  useEffect(() => {
    (async () => {
      if (freeMintBitzXpGameComingUp) {
        await sleep(10);

        handleProgressModalClose();

        // setFreeMintBitzXpGameComingUp(false);
        // onProgressModalClose();

        onRemoteTriggerOfBiTzPlayModel(true);
      }
    })();
  }, [freeMintBitzXpGameComingUp]);

  const handleProgressModalClose = () => {
    setFreeDropCheckLoading(false);
    setErrFreeMintGeneric(null);
    setFreeMintBitzXpLoading(false);
    onProgressModalClose();
    setFreeMintBitzXpGameComingUp(false);
    setFreeMintBitzXpIntroToAction(false);
    setFreeMintMusicGiftIntroToAction(false);
    setFreeMintMusicGiftLoading(false);
  };

  const handleFreeMintBitzXP = async () => {
    if (!userPublicKey) {
      return;
    }

    setFreeMintBitzXpLoading(true);

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

    let _errInWorkflow = null;

    try {
      const miscMintRes = await mintMiscDataNft("bitzxp", userPublicKey.toBase58(), usedPreAccessSignature, usedPreAccessNonce);

      if (miscMintRes.error) {
        setErrFreeMintGeneric(miscMintRes.error || miscMintRes?.e?.toString() || "unknown error");
      } else if (miscMintRes?.newDBLogEntryCreateFailed) {
        _errInWorkflow = "Misc mint passed, but the db log failed";
      }

      if (miscMintRes?.assetId) {
        // check 15 seconds and check if the API in the backend to mark the free mint as done
        await sleep(15);

        setFreeDropCheckNeededForBitz(freeDropCheckNeededForBitz + 1);

        // update the NFT store now as we have a new NFT
        const _allDataNfts: DasApiAsset[] = await fetchSolNfts(userPublicKey?.toBase58());
        updateAllDataNfts(_allDataNfts);
      } else {
        if (miscMintRes?.error) {
          _errInWorkflow = "Error! " + miscMintRes?.error;
        } else {
          _errInWorkflow = "Error! Free minting has failed, have you met all the requirements below? if so, please try again.";
        }
      }
    } catch (e: any) {
      _errInWorkflow = e.toString();
    }

    if (!_errInWorkflow) {
      await sleep(5);
      setFreeMintBitzXpLoading(false);
      setFreeMintBitzXpGameComingUp(true); // show a message for 10 seconds that the game is coming
    } else {
      setFreeMintBitzXpLoading(false);
      setErrFreeMintGeneric(_errInWorkflow);
    }
  };

  const handleFreeMintMusicGift = async () => {
    if (!userPublicKey) {
      return;
    }

    setFreeMintMusicGiftLoading(true);

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

    let _errInWorkflow = null;

    sleep(5);

    try {
      const miscMintRes = await mintMiscDataNft("musicgift", userPublicKey.toBase58(), usedPreAccessSignature, usedPreAccessNonce);

      if (miscMintRes.error) {
        setErrFreeMintGeneric(miscMintRes.error || miscMintRes?.e?.toString() || "unknown error");
      } else if (miscMintRes?.newDBLogEntryCreateFailed) {
        _errInWorkflow = "Misc mint passed, but the db log failed";
      }

      if (miscMintRes?.assetId) {
        // check 15 seconds and check if the API in the backend to mark the free mint as done
        await sleep(15);

        setFreeDropCheckNeededForMusicGift(freeDropCheckNeededForMusicGift + 1);

        // update the NFT store now as we have a new NFT
        const _allDataNfts: DasApiAsset[] = await fetchSolNfts(userPublicKey?.toBase58());
        updateAllDataNfts(_allDataNfts);
      } else {
        if (miscMintRes?.error) {
          _errInWorkflow = "Error! " + miscMintRes?.error;
        } else {
          _errInWorkflow = "Error! Free minting has failed, have you met all the requirements below? if so, please try again.";
        }
      }
    } catch (e: any) {
      _errInWorkflow = e.toString();
    }

    if (!_errInWorkflow) {
      await sleep(5);
      setFreeMintMusicGiftLoading(false);
    } else {
      setFreeMintMusicGiftLoading(false);
      setErrFreeMintGeneric(_errInWorkflow);
    }
  };

  /* S: Animation
  https://codesandbox.io/p/sandbox/framer-motion-nav-show-hide-2024-updated-version-5j7gc9?file=%2Fsrc%2FNav.tsx%3A3%2C18-3%2C37&from-embed
  */
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);

  function update(latest: number, prev: number): void {
    if (latest < prev) {
      setHidden(false);
    } else if (latest > 100 && latest > prev) {
      setHidden(true);
    }
  }

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    update(latest, prevScroll);
    setPrevScroll(latest);

    // Show indicator when near top, hide when scrolling down
    if (latest <= 50) {
      setShowScrollIndicator(true);
    } else {
      setShowScrollIndicator(false);
    }
  });
  // E: Animation

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection="column" alignItems="center" justifyContent="center">
      <Box width={"100%"} padding={{ base: "2", md: "5" }} textAlign="center">
        <Box>
          <Heading ref={helloHeadingRef} as="h1" size="2xl" fontFamily="Satoshi-Regular" my={{ base: "0", md: "5" }}>
            Hello Human,
          </Heading>
          <Heading as="h1" size={{ base: "lg", md: "xl" }} fontFamily="Satoshi-Regular" w="70%" textAlign="center" margin="auto" my={{ base: "2", md: "5" }}>
            Join the AI Workforce, prove your reputation, co-create new data with me and get rewarded
          </Heading>
        </Box>

        {!isUserLoggedIn && (
          <AnimatePresence>
            <motion.nav
              variants={parentVariants}
              initial="visible"
              animate={hidden ? "hidden" : "visible"}
              exit="hidden"
              transition={{
                ease: [0.1, 0.25, 0.3, 1],
                duration: 3,
                staggerChildren: 0.05,
              }}>
              <div className="navLinksWrapper">
                <motion.img className="rounded-[.1rem] m-auto -z-1 w-[50%] h-[100%]" src={nfMeIDVault} />
              </div>
            </motion.nav>
          </AnimatePresence>
        )}

        <Box className="mt-5">
          <Box display="inline-flex" mt="5">
            <Text fontSize="xl" fontWeight="bold" fontFamily="Satoshi-Regular">
              Pulsating orbs guide you to your next task/s
            </Text>
            <FocusOnThisEffect />
          </Box>
          <Box width={"100%"} minH="400px" padding={5}>
            <Flex flexDirection={["column", null, "row"]} gap={2} minH="90%">
              <Box flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
                <Badge colorScheme="teal" fontSize="md">
                  Stage 1
                </Badge>
                <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
                  Get Started for Free
                </Heading>

                <Flex flexDirection="column" gap="3">
                  <Flex flexDirection="column" gap={2} p={2} pb={5} borderBottom="1px solid" borderColor="teal.200">
                    {!isUserLoggedIn && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center" fontFamily="Satoshi-Regular">
                      Login via Wallet
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      You need this to collect your rewards
                    </Text>

                    {!isUserLoggedIn ? (
                      <Button
                        m="auto"
                        colorScheme="teal"
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        onClick={() => {
                          onShowConnectWalletModal("sol");
                        }}>
                        Login via Wallet
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

                  {/* Get the BiTz XP airdrop -- ONLY ENABLE if the user has logged in & does NOT have a BitZ XP already */}
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    pb={5}
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn ? "none" : "initial"}>
                    {isUserLoggedIn && !hasBitzNft && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Get a Free BiTz XP Data NFT
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Use it to collect and own your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Itheum XP
                      </Text>{" "}
                      by staying active in the ecosystem
                    </Text>

                    <Button
                      m="auto"
                      colorScheme="teal"
                      variant={freeBitzClaimed ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || freeBitzClaimed}
                      onClick={() => {
                        setFreeMintBitzXpIntroToAction(true);
                        onProgressModalOpen();
                      }}>
                      {freeBitzClaimed ? "Claimed" : "Free Mint Now"}
                    </Button>

                    {userHasG2BiTzNft && (
                      <Alert status="info" rounded="md" fontSize="sm">
                        <AlertIcon />
                        You have the G2 BiTz XP NFT from DRiP. Claim the new G3 version for free and contact us on itheum.io/discord to migrate your XP.
                      </Alert>
                    )}

                    {isUserLoggedIn && !freeBitzClaimed ? (
                      <Text fontSize="xs" textAlign="center">
                        Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure
                        your wallet exists and can receive the NFT.
                      </Text>
                    ) : (
                      <Box margin="auto">
                        <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                      </Box>
                    )}
                  </Flex>

                  {/* Get the NFMe ID airdrop -- ONLY ENABLE if the user has logged in & does NOT have a free NFMe ID already */}
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                    {isUserLoggedIn && !hasBitzNft && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free BiTz XP Data NFT first!`}
                      </Alert>
                    )}

                    {isUserLoggedIn && freeBitzClaimed && !freeNfMeIdClaimed && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Get a Free NFMe ID
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Use it as your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Web3 Identity
                      </Text>{" "}
                      for AI agents to verify you
                    </Text>

                    <Button
                      m="auto"
                      colorScheme="teal"
                      variant={freeNfMeIdClaimed ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || freeNfMeIdClaimed}
                      onClick={() => {
                        setIsNFMeIDModalOpen(true);
                        // navigate("/mintdata?launchTemplate=nfMeIdFreeMint");
                      }}>
                      {freeNfMeIdClaimed ? "Claimed" : "Free Mint Now"}
                    </Button>

                    {isUserLoggedIn && freeBitzClaimed && !freeNfMeIdClaimed ? (
                      <Text fontSize="xs" textAlign="center">
                        Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure
                        your wallet exists and can receive the NFT.
                      </Text>
                    ) : (
                      <Box margin="auto">
                        <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </Box>

              <Box flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
                <Badge colorScheme="teal" fontSize="md">
                  Stage 2
                </Badge>
                <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
                  Grow Reputation
                </Heading>

                <Flex flexDirection="column" gap="3">
                  {/* Play the BiTz Game -- ONLY ENABLE if the user has a BiTz Data NFT */}
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    pb={5}
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                    pointerEvents={!hasBitzNft ? "none" : "initial"}>
                    {isUserLoggedIn && !hasBitzNft && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free BiTz XP Data NFT first!`}
                      </Alert>
                    )}

                    {isUserLoggedIn && cooldown === 0 && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Boost Your Proof-of-Activity
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      You need BiTz to vote to curate AI content. Earn BiTz every few hours.
                    </Text>

                    <Button
                      m="auto"
                      display={{ base: "none", md: "inline-flex" }}
                      size={{ md: "md", xl: "md", "2xl": "lg" }}
                      p="8 !important"
                      onClick={() => onRemoteTriggerOfBiTzPlayModel(true)}
                      isDisabled={!isUserLoggedIn}>
                      <Text fontSize="xl">{bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}</Text>

                      <LuFlaskRound fontSize={"2.2rem"} fill="#03c797" />

                      {hasBitzNft && cooldown <= 0 && cooldown != -2 && (
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
                        onClick={() => onRemoteTriggerOfBiTzPlayModel(true)}
                        m="auto"
                        colorScheme="teal"
                        variant="outline"
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        w={{ base: "100%", md: "280px" }}>
                        <span>
                          {cooldown === -2 ? (
                            <span>Check XP Balance & Play</span>
                          ) : cooldown > 0 ? (
                            <Countdown unixTime={cooldown} />
                          ) : (
                            <span> Claim Your BiTz XP</span>
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
                      w={{ base: "100%", md: "280px" }}
                      onClick={() => {
                        alert("Buy BiTz Coming Soon...");
                      }}>
                      Buy BiTz
                    </Button>

                    {/* if the user has recently ed and the countdown to next play is active then consider this done */}
                    {isUserLoggedIn && hasBitzNft && cooldown > 0 && (
                      <Box margin="auto">
                        <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                      </Box>
                    )}
                  </Flex>

                  {/* Bond on your NFMe and Make it a vault -- ONLY ENABLE if the user has no bonded NFMe and a Vault */}
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    opacity={!isUserLoggedIn || !freeNfMeIdClaimed ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !freeNfMeIdClaimed ? "none" : "initial"}>
                    {isUserLoggedIn && !freeNfMeIdClaimed && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free NFMe ID  first!`}
                      </Alert>
                    )}

                    {isUserLoggedIn && hasBitzNft && freeNfMeIdClaimed && usersNfMeIdVaultBondId === 0 && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Boost Your Proof-of-Reputation
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Bond $ITHEUM on your NFMe ID, this grows your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Liveliness
                      </Text>{" "}
                      to signal the AI Agents that you are committed to completing your tasks.
                    </Text>

                    {/* check if the user has at least 1 bond */}
                    <Button
                      m="auto"
                      colorScheme="teal"
                      variant={bondedDataNftIds.length > 0 ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      w={{ base: "100%", md: "280px" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || bondedDataNftIds.length > 0}
                      onClick={() => {
                        navigate("/datanfts/unbonded");
                      }}>
                      Bond $ITHEUM on your NFMe ID
                    </Button>

                    <Text textAlign="center" fontSize="sm">
                      Currently{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        {currentMaxApr}% APR
                      </Text>{" "}
                      on your NFMe ID Bonds
                    </Text>

                    {isUserLoggedIn && hasBitzNft && bondedDataNftIds.length > 0 && (
                      <Box margin="auto">
                        <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                      </Box>
                    )}

                    {/* check if the user has no vault and then allow them to action that -- only show if the user has a NFMe ID with bonds but no vault (which is a boundary case) */}
                    {isUserLoggedIn && bondedDataNftIds.length > 0 && usersNfMeIdVaultBondId === 0 && (
                      <>
                        <Button
                          m="auto"
                          colorScheme="teal"
                          variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                          fontSize={{ base: "sm", md: "md" }}
                          size={{ base: "sm", lg: "lg" }}
                          w={{ base: "100%", md: "280px" }}
                          isLoading={freeDropCheckLoading}
                          isDisabled={!isUserLoggedIn || bondedDataNftIds.length === 0 || usersNfMeIdVaultBondId > 0}
                          onClick={() => {
                            navigate("/liveliness?hl=makevault");
                          }}>
                          Upgrade the NFMe ID into a Vault
                        </Button>

                        {bondedDataNftIds.length > 0 && usersNfMeIdVaultBondId > 0 && (
                          <Box margin="auto">
                            <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                          </Box>
                        )}
                      </>
                    )}
                  </Flex>
                </Flex>
              </Box>

              <Box flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
                <Badge colorScheme="teal" fontSize="md">
                  Stage 3
                </Badge>
                <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
                  Co-Create with AI
                </Heading>

                <Flex flexDirection="column" gap="3">
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    pb={5}
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                    <Text textAlign="center" fontSize="lg" fontWeight="bold" mb="5">
                      {`<< `}The Following Jobs Are Live{` >>`}
                    </Text>

                    <Heading as="h3" size="md" textAlign="center">
                      NF-Tunes AI Music Feedback
                    </Heading>
                    <Text textAlign="center" fontSize="md">
                      Help music artists improve their songs by providing feedback that trains AI Agents
                    </Text>
                  </Flex>

                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    pb={5}
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                    <Text textAlign="center" fontSize="2xl">
                      1.
                    </Text>

                    {isUserLoggedIn && !hasBitzNft && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free BiTz XP Data NFT first!`}
                      </Alert>
                    )}

                    {isUserLoggedIn && hasBitzNft && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Get Free Music Data NFT
                    </Heading>

                    <Text textAlign="center">Claim it and use it on NF-Tunes</Text>

                    <Button
                      margin="auto"
                      colorScheme="teal"
                      variant={freeMusicGiftClaimed ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || freeMusicGiftClaimed}
                      w={{ base: "100%", md: "280px" }}
                      onClick={() => {
                        setFreeMintMusicGiftIntroToAction(true);
                        onProgressModalOpen();
                      }}>
                      {freeMusicGiftClaimed ? "Claimed" : "Free Mint Now"}
                    </Button>

                    <Button
                      margin="auto"
                      colorScheme="teal"
                      variant="outline"
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      w={{ base: "100%", md: "280px" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || !freeMusicGiftClaimed}
                      onClick={() => {
                        window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sample`, "_blank");
                      }}>
                      Use Music Data NFT on NF-Tunes
                    </Button>

                    {freeMusicGiftClaimed && (
                      <Box margin="auto">
                        <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                      </Box>
                    )}
                  </Flex>

                  {/* lets people vote on content with BitZ: ONLY ENABLE if the user has a BiTz Data NFT and have more than 0 BiTz balance */}
                  <Flex flexDirection="column" gap={2} p={2} opacity={!hasBitzNft ? 0.5 : "initial"} pointerEvents={!hasBitzNft ? "none" : "initial"}>
                    {isUserLoggedIn && !hasBitzNft && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free BiTz XP Data NFT first!`}
                      </Alert>
                    )}
                    <Text textAlign="center" fontSize="2xl">
                      2.
                    </Text>

                    {isUserLoggedIn && hasBitzNft && bitzBalance > 0 && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Vote to Power-Up & Like Music Content
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Vote for content by gifting BiTz to music content created by Music Creators. Feedback is used to train AI Agents
                    </Text>

                    <Button
                      margin="auto"
                      colorScheme="teal"
                      variant="outline"
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || bitzBalance === 0}
                      w={{ base: "100%", md: "280px" }}
                      onClick={() => {
                        window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sigma`, "_blank");
                      }}>
                      Gift BiTz XP on NF-Tunes
                    </Button>
                  </Flex>
                </Flex>
              </Box>

              <Box flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
                <Badge colorScheme="teal" fontSize="md">
                  Stage 4
                </Badge>
                <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
                  Share Rewards
                </Heading>

                {isUserLoggedIn && usersNfMeIdVaultBondId === 0 && (
                  <Alert status="warning" rounded="md" fontSize="md" mb="5">
                    <AlertIcon />
                    {`You need to ${isUserLoggedIn ? "" : "login and "} complete STAGE 2 to access these benefits!`}
                  </Alert>
                )}

                {/* lets people top up their vault or withdraw rewards etc:  ONLY ENABLE if the user is Logged IN && has a BiTz Data NFT && has already setup a NFMeId Vault */}
                <Flex flexDirection="column" gap="3">
                  <Flex
                    flexDirection="column"
                    gap={2}
                    p={2}
                    pb={5}
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? "none" : "initial"}>
                    {isUserLoggedIn && usersNfMeIdVaultBondId > 0 && <FocusOnThisEffect />}

                    <Heading as="h3" size="md" textAlign="center">
                      Liveliness Staking Rewards
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Get a share of protocol rewards for your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Liveliness
                      </Text>
                      . Currently{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        {currentMaxApr}% APR
                      </Text>{" "}
                      on your NFMe ID Bonds
                    </Text>

                    {/* if the user has a vault allow them to top-up */}
                    <Button
                      margin="auto"
                      colorScheme="teal"
                      variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                      w={{ base: "100%", md: "280px" }}
                      onClick={() => {
                        navigate("/liveliness?hl=topup");
                      }}>
                      Top-up Vault for Higher Staking Rewards
                    </Button>

                    {/* if the user has a vault allow them to claim rewards */}
                    <Button
                      margin="auto"
                      colorScheme="teal"
                      variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                      fontSize={{ base: "sm", md: "md" }}
                      size={{ base: "sm", lg: "lg" }}
                      w={{ base: "100%", md: "280px" }}
                      isLoading={freeDropCheckLoading}
                      isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                      onClick={() => {
                        navigate("/liveliness?hl=claim");
                      }}>
                      Claim Rewards
                    </Button>
                  </Flex>
                </Flex>

                {/* Claim Badges - ONLY ENABLE if the user is Logged IN && has a BiTz Data NFT && has already setup a NFMeId Vault */}
                <Flex
                  flexDirection="column"
                  gap="3"
                  mt="5"
                  opacity={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? 0.5 : "initial"}
                  pointerEvents={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? "none" : "initial"}>
                  {hasUnclaimedBadges && <FocusOnThisEffect />}

                  <BadgesPreview
                    isUserLoggedIn={isUserLoggedIn}
                    onHasUnclaimedBadges={(status: boolean) => {
                      setHasUnclaimedBadges(status);
                    }}
                  />
                </Flex>

                {/* Claim Credentials - only available if the user has a NFMe ID Vault @TODO */}
              </Box>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* Modal : Free Claims */}
      <Modal
        size={modelSize}
        isOpen={isProgressModalOpen}
        onClose={handleProgressModalClose}
        closeOnEsc={false}
        closeOnOverlayClick={false}
        blockScrollOnMount={false}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
          {!freeMintBitzXpLoading && !freeMintMusicGiftLoading && <ModalCloseButton />}
          <ModalHeader mt={5} textAlign="center" fontSize="2xl" color="teal.200">
            {freeMintBitzXpIntroToAction ? "Get Your Free BiTz XP Data NFT Airdrop!" : ""}
            {freeMintMusicGiftIntroToAction ? "Get Your Free Sample Music Data NFT Airdrop!" : ""}
          </ModalHeader>
          <ModalBody pb={6}>
            {freeMintBitzXpIntroToAction && (
              <Flex flexDirection="column">
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                  With Itheum, your XP Data is yours to own! 🚀
                </Text>
                <Text mt="5" textAlign="center">
                  BiTz are{" "}
                  <Text as="span" fontWeight="bold" color="teal.200">
                    Itheum XP
                  </Text>{" "}
                  stored as Data NFTs in your wallet. Use them to curate, power up, and interact with data while earning rewards. Your BiTz NFT unlocks access
                  to the Itheum Protocol and the Web3 AI Data Era.
                </Text>

                {!errFreeMintGeneric && !freeNfMeIdClaimed && (
                  <>
                    {!freeMintBitzXpGameComingUp ? (
                      <>
                        <Button
                          m="auto"
                          mt="5"
                          colorScheme="teal"
                          variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                          fontSize={{ base: "sm", md: "md" }}
                          size={{ base: "sm", lg: "lg" }}
                          w={{ base: "100%", md: "280px" }}
                          disabled={freeMintBitzXpLoading}
                          isLoading={freeMintBitzXpLoading}
                          onClick={() => {
                            handleFreeMintBitzXP();
                          }}>
                          LFG! Give Me My Airdrop!
                        </Button>

                        {freeMintBitzXpLoading && (
                          <Text fontSize="md" textAlign="center" mt="2" color="teal.200">
                            ⏳ Please wait... this can take a few minutes as {`it's`} airdropping to your wallet.
                          </Text>
                        )}
                      </>
                    ) : (
                      <Alert status={"success"} mt={5} rounded="md" mb={8}>
                        <AlertIcon />
                        <Box>
                          <Text> Success! {`Let's`} get you your first event BiTz XP, game coming up in 5,4,3,2,1...</Text>
                        </Box>
                      </Alert>
                    )}
                  </>
                )}

                {errFreeMintGeneric && (
                  <Alert status="error" mt={5} rounded="md" mb={8}>
                    <AlertIcon />
                    <Box>
                      <Text>{errFreeMintGeneric}</Text>
                    </Box>
                  </Alert>
                )}

                {((!freeNfMeIdClaimed && !freeMintBitzXpGameComingUp) || errFreeMintGeneric) && (
                  <Text fontSize="xs" textAlign="center" mt="2">
                    Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure your
                    wallet exists and can receive the NFT.
                  </Text>
                )}
              </Flex>
            )}

            {freeMintMusicGiftIntroToAction && (
              <Flex flexDirection="column">
                <Image margin="auto" boxSize="auto" w={{ base: "60%", md: "60%" }} src={MusicGiftPreview} alt="Music Data NFT Preview" />
                <Text fontSize="2xl" fontWeight="bold" textAlign="center" mt="5">
                  Revolutionizing Music with AI
                </Text>
                <Text mt="5" textAlign="center">
                  Itheum connects AI Agents, musicians, and fans to amplify music and train AI models, empowering real-world artists and enhancing music
                  content. Get your free Music Data NFT and join this initiative!
                </Text>

                {!errFreeMintGeneric && (
                  <>
                    {!freeMusicGiftClaimed ? (
                      <>
                        <Button
                          m="auto"
                          mt="5"
                          colorScheme="teal"
                          variant={"outline"}
                          fontSize={{ base: "sm", md: "md" }}
                          size={{ base: "sm", lg: "lg" }}
                          w={{ base: "100%", md: "280px" }}
                          disabled={freeMintMusicGiftLoading}
                          isLoading={freeMintMusicGiftLoading}
                          onClick={() => {
                            handleFreeMintMusicGift();
                          }}>
                          LFG! Give Me My Airdrop!
                        </Button>

                        {freeMintMusicGiftLoading && (
                          <Text fontSize="md" textAlign="center" mt="2" color="teal.200">
                            ⏳ Please wait... this can take a few minutes as {`it's`} airdropping to your wallet.
                          </Text>
                        )}
                      </>
                    ) : (
                      <Alert status={"success"} mt={5} rounded="md" mb={8}>
                        <AlertIcon />
                        <Box>
                          <Text> Success! Try it out now!</Text>
                          <Button
                            margin="auto"
                            colorScheme="teal"
                            variant="outline"
                            fontSize={{ base: "sm", md: "md" }}
                            size={{ base: "sm", lg: "lg" }}
                            w={{ base: "100%", md: "280px" }}
                            mt={3}
                            onClick={() => {
                              window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sample`, "_blank");
                            }}>
                            Use Music Data NFT on NF-Tunes
                          </Button>
                        </Box>
                      </Alert>
                    )}
                  </>
                )}

                {errFreeMintGeneric && (
                  <Alert status="error" mt={5} rounded="md" mb={8}>
                    <AlertIcon />
                    <Box>
                      <Text>{errFreeMintGeneric}</Text>
                    </Box>
                  </Alert>
                )}

                {(!freeMusicGiftClaimed || errFreeMintGeneric) && (
                  <Text fontSize="xs" textAlign="center" mt="2">
                    Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure your
                    wallet exists and can receive the NFT.
                  </Text>
                )}
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal : NFMe Minting Options */}
      <NFMeIDMintModal
        isOpen={isNFMeIDModalOpen}
        onClose={() => setIsNFMeIDModalOpen(false)}
        onFreeMint={() => {
          navigate("/mintdata?launchTemplate=nfMeIdFreeMint");
          setIsNFMeIDModalOpen(false);
        }}
        onMintAndBond={() => {
          navigate("/mintdata?launchTemplate=nfMeIdWithBond");
          setIsNFMeIDModalOpen(false);
        }}
      />

      {/* Scroll Down Indicator if user is not logged in  */}
      {!isUserLoggedIn && (
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem",
                zIndex: 10,
              }}>
              <Box
                as={BsChevronDoubleDown}
                color="teal.200"
                fontSize="2.5rem"
                className="animate-bounce"
                sx={{
                  animation: "pulse-and-bounce 2s infinite",
                  "@keyframes pulse-and-bounce": {
                    "0%, 100%": {
                      transform: "translateY(0)",
                      opacity: 0.5,
                    },
                    "50%": {
                      transform: "translateY(10px)",
                      opacity: 1,
                    },
                  },
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Flex>
  );
};

function FocusOnThisEffect() {
  return (
    <Box className="absolute flex h-8 w-8">
      <Box className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03c797] opacity-75"></Box>
    </Box>
  );
}

export default Dashboard;
