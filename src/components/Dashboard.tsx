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
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  Link,
  Badge,
  useBreakpointValue,
  useDisclosure,
  useColorMode,
} from "@chakra-ui/react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useLocalStorage, useWallet } from "@solana/wallet-adapter-react";
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
import { FocusOnThisEffect } from "libs/utils/ui";
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

// some actions can be repeated unlimited times (e.g. giving bitx) so to void user overload on the blinking orbs, we can hide them for XX seconds after a user clicks them
const focusStaticEffectClicksTs: Record<string, number> = {
  "E3-1": -1,
  "E3-2": -1,
  "E4-1": -1,
  "E4-2": -1,
};
const hideOrbsOnStaticEffectClicksForMin = 60; // by default we hide the orbs for 60 minutes for static tasks

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
  const [focusOnStaticEffectClicks, setFocusOnStaticEffectClicks] = useLocalStorage("itm-focus-on-static-effect-clicks", { ...focusStaticEffectClicksTs });
  const isMobile = useBreakpointValue({ base: true, md: false });

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

      if (miscMintRes?.mintDoneMintMetaSkipped) {
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
    } catch (err: any) {
      _errInWorkflow = err.toString();
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

      if (miscMintRes?.mintDoneMintMetaSkipped) {
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
    } catch (err: any) {
      _errInWorkflow = err.toString();
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

  const shouldFocusOnThisStaticEffect = (effectId: string, allowAfterMin: number = hideOrbsOnStaticEffectClicksForMin) => {
    return focusOnStaticEffectClicks[effectId] === -1 || new Date().getTime() - focusOnStaticEffectClicks[effectId] > allowAfterMin * 60 * 1000;
  };

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection="column" alignItems="center" justifyContent="center">
      <Box width={"100%"} padding={{ base: "2", md: "5" }} textAlign="center">
        <Box>
          <Heading ref={helloHeadingRef} as="h1" size="2xl" fontFamily="Satoshi-Regular" my={{ base: "0", md: "5" }}>
            Hello Human,
          </Heading>
          <Heading as="h1" size={{ base: "lg", md: "xl" }} fontFamily="Satoshi-Regular" w="70%" textAlign="center" margin="auto" my={{ base: "2", md: "5" }}>
            Join the AI Workforce, prove your reputation, co-create new data with AI Agents and get rewarded
          </Heading>
        </Box>

        {isUserLoggedIn && (
          <>
            <Box
              w="80%"
              h="auto"
              margin="auto"
              display="flex"
              justifyContent="center"
              alignItems="center"
              opacity={usersNfMeIdVaultBondId === 0 ? 0.5 : "initial"}
              pointerEvents={usersNfMeIdVaultBondId === 0 ? "none" : "initial"}>
              <BadgesPreview
                isUserLoggedIn={isUserLoggedIn}
                badgeSummaryHeaderMode={true}
                showStage2Disclaimer={usersNfMeIdVaultBondId === 0}
                onHasUnclaimedBadges={(status: boolean) => {
                  setHasUnclaimedBadges(status);
                }}
              />
            </Box>
          </>
        )}

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

        <Box className="mt-1">
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
                    <Heading as="h3" size="md" textAlign="center" fontFamily="Satoshi-Regular">
                      Login via Wallet
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      You need this to collect your rewards
                    </Text>

                    {!isUserLoggedIn ? (
                      <Box position="relative">
                        <FocusOnThisEffect top="-10px" />
                        <Button
                          m="auto"
                          colorScheme="teal"
                          fontSize={{ base: "sm", md: "md" }}
                          size={{ base: "sm", lg: "lg" }}
                          w={{ base: "100%", md: "280px" }}
                          onClick={() => {
                            onShowConnectWalletModal("sol");
                          }}>
                          Login via Wallet
                        </Button>
                      </Box>
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

                    <Box position="relative">
                      {isUserLoggedIn && !hasBitzNft && <FocusOnThisEffect top="-10px" />}
                      <Button
                        m="auto"
                        colorScheme="teal"
                        variant={freeBitzClaimed ? "solid" : "outline"}
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        isLoading={freeDropCheckLoading}
                        isDisabled={!isUserLoggedIn || freeBitzClaimed}
                        w={{ base: "100%", md: "280px" }}
                        onClick={() => {
                          setFreeMintBitzXpIntroToAction(true);
                          onProgressModalOpen();
                        }}>
                        {freeBitzClaimed ? "Claimed" : "Free Mint Now"}
                      </Button>
                    </Box>

                    {userHasG2BiTzNft && (
                      <Alert status="info" rounded="md" fontSize="sm">
                        <AlertIcon />
                        <Text>
                          You have the G2 BiTz XP NFT from DRiP. Claim the new G3 version for free (if you have not already) and contact us on{" "}
                          <Link href="https://itheum.io/discord" isExternal textDecoration="underline">
                            itheum.io/discord
                          </Link>{" "}
                          to migrate your XP from G2 to G3.
                        </Text>
                      </Alert>
                    )}

                    {isUserLoggedIn && freeBitzClaimed && (
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
                      w={{ base: "100%", md: "280px" }}
                      onClick={() => {
                        setIsNFMeIDModalOpen(true);
                      }}>
                      {freeNfMeIdClaimed ? "Claimed" : "Free Mint Now"}
                    </Button>

                    {isUserLoggedIn && freeBitzClaimed && freeNfMeIdClaimed && (
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
                    pb={10}
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

                    <Box position="relative">
                      {isUserLoggedIn && cooldown === 0 && <FocusOnThisEffect top="-10px" />}
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
                    </Box>

                    {/* <Button
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
                    </Button> */}

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
                    pt={5}
                    opacity={!isUserLoggedIn || !freeNfMeIdClaimed ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !freeNfMeIdClaimed ? "none" : "initial"}>
                    {isUserLoggedIn && !freeNfMeIdClaimed && (
                      <Alert status="warning" rounded="md" fontSize="md">
                        <AlertIcon />
                        {`You need to ${isUserLoggedIn ? "" : "login and "} get your free NFMe ID  first!`}
                      </Alert>
                    )}

                    <Heading as="h3" size="md" textAlign="center">
                      Boost Your Proof-of-Reputation
                    </Heading>

                    <Text textAlign="center" fontSize="md" my="2">
                      Bond $ITHEUM on your NFMe ID, this grows your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Liveliness
                      </Text>{" "}
                      to signal to AI Agents that you are committed to completing your tasks.
                    </Text>

                    <Box position="relative">
                      {isUserLoggedIn && hasBitzNft && freeNfMeIdClaimed && usersNfMeIdVaultBondId === 0 && <FocusOnThisEffect top="-10px" />}

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
                    </Box>

                    {currentMaxApr > 0 && (
                      <Text textAlign="center" fontSize="sm">
                        Currently{" "}
                        <Text as="span" fontWeight="bold" color="teal.200">
                          {currentMaxApr}% APR
                        </Text>{" "}
                        on your NFMe ID Bonds
                      </Text>
                    )}

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
                    borderBottom="1px solid"
                    borderColor="teal.200"
                    opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                    pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                    <Heading as="h3" size="md" textAlign="center">
                      NF-Tunes AI Music Feedback
                    </Heading>
                    <Text textAlign="center" fontSize="md">
                      Help music artists improve their songs by providing feedback that trains AI Agents
                    </Text>

                    <Text textAlign="center" fontSize="lg" fontWeight="bold" m="2">
                      {`<< `}The Following Jobs Are Live{` >>`}
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

                    <Box>
                      <Heading as="h3" size="md" textAlign="center">
                        Get Free Music Data NFT
                      </Heading>

                      <Text textAlign="center" fontSize="md" my="2">
                        Get a unique Music Album that you can use on NF-Tunes
                      </Text>

                      <Box position="relative">
                        {isUserLoggedIn && hasBitzNft && !freeMusicGiftClaimed && <FocusOnThisEffect top="-10px" />}
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
                      </Box>

                      {freeMusicGiftClaimed && (
                        <Flex alignItems="center" justifyContent="center" mt="2">
                          <BsBookmarkCheckFill fontSize="2rem" color="#03c797" />
                        </Flex>
                      )}
                    </Box>

                    <Box>
                      <Heading as="h3" size="sm" textAlign="center" mt="2" mb="2">
                        Use your Music Data NFT on NF-Tunes
                      </Heading>
                      <Box position="relative">
                        {isUserLoggedIn && hasBitzNft && shouldFocusOnThisStaticEffect("E3-1", 180) && <FocusOnThisEffect top="-10px" />}

                        <Button
                          id="E3-1"
                          margin="auto"
                          colorScheme="teal"
                          variant="outline"
                          fontSize={{ base: "sm", md: "md" }}
                          size={{ base: "sm", lg: "lg" }}
                          w={{ base: "100%", md: "280px" }}
                          isLoading={freeDropCheckLoading}
                          isDisabled={!isUserLoggedIn || !freeMusicGiftClaimed}
                          onClick={() => {
                            setFocusOnStaticEffectClicks({ ...focusOnStaticEffectClicks, "E3-1": new Date().getTime() });
                            window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sample`, "_blank");
                          }}>
                          Use Music Data NFT on NF-Tunes
                        </Button>
                      </Box>
                    </Box>
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

                    <Heading as="h3" size="md" textAlign="center">
                      Vote to Power-Up & Like Music Content
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Vote for content by gifting BiTz to music content created by Music Creators and AI Agents. The more you gift, the more badges you earn.
                    </Text>

                    <Box position="relative">
                      {isUserLoggedIn && hasBitzNft && bitzBalance > 0 && shouldFocusOnThisStaticEffect("E3-2", 120) && <FocusOnThisEffect top="-10px" />}

                      <Button
                        id="E3-2"
                        margin="auto"
                        colorScheme="teal"
                        variant="outline"
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        isLoading={freeDropCheckLoading}
                        isDisabled={!isUserLoggedIn || bitzBalance === 0}
                        w={{ base: "100%", md: "280px" }}
                        onClick={() => {
                          setFocusOnStaticEffectClicks({ ...focusOnStaticEffectClicks, "E3-2": new Date().getTime() });
                          window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sigma`, "_blank");
                        }}>
                        Gift BiTz XP on NF-Tunes
                      </Button>
                    </Box>
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
                    <Heading as="h3" size="md" textAlign="center">
                      Liveliness Staking Rewards
                    </Heading>

                    <Text textAlign="center" fontSize="md">
                      Get a share of protocol rewards for your{" "}
                      <Text as="span" fontWeight="bold" color="teal.200">
                        Liveliness
                      </Text>
                      .
                      {currentMaxApr > 0 && (
                        <>
                          Currently{" "}
                          <Text as="span" fontWeight="bold" color="teal.200">
                            {currentMaxApr}% APR
                          </Text>{" "}
                          on your NFMe ID Bonds
                        </>
                      )}
                    </Text>

                    <Box position="relative">
                      {isUserLoggedIn && usersNfMeIdVaultBondId > 0 && shouldFocusOnThisStaticEffect("E4-1", 180) && <FocusOnThisEffect top="-10px" />}
                      {/* if the user has a vault allow them to top-up */}
                      <Button
                        id="E4-1"
                        margin="auto"
                        colorScheme="teal"
                        variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        isLoading={freeDropCheckLoading}
                        isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                        w={{ base: "100%", md: "280px" }}
                        onClick={async () => {
                          setFocusOnStaticEffectClicks({ ...focusOnStaticEffectClicks, "E4-1": new Date().getTime() });
                          await sleep(0.3);
                          navigate("/liveliness?hl=topup");
                        }}>
                        Top-up Vault for Higher Staking Rewards
                      </Button>
                    </Box>

                    <Box position="relative">
                      {isUserLoggedIn && usersNfMeIdVaultBondId > 0 && shouldFocusOnThisStaticEffect("E4-2", 180) && <FocusOnThisEffect top="-10px" />}
                      {/* if the user has a vault allow them to claim rewards */}
                      <Button
                        id="E4-2"
                        margin="auto"
                        colorScheme="teal"
                        variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        w={{ base: "100%", md: "280px" }}
                        isLoading={freeDropCheckLoading}
                        isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                        onClick={async () => {
                          setFocusOnStaticEffectClicks({ ...focusOnStaticEffectClicks, "E4-2": new Date().getTime() });
                          await sleep(0.3);
                          navigate("/liveliness?hl=claim");
                        }}>
                        Claim Rewards
                      </Button>
                    </Box>
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
                          <Text> Success! {`Let's`} get you your first ever BiTz XP, game coming up in 5,4,3,2,1...</Text>
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
                      <Alert status={"success"} mt={5} rounded="md" mb={8} textAlign="center">
                        <Box w="100%">
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
                              setFocusOnStaticEffectClicks({ ...focusOnStaticEffectClicks, "E3-1": new Date().getTime() });
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
      {!isUserLoggedIn && !isMobile && (
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
                fontSize={{ md: "6.5rem", lg: "8.5rem" }}
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

export default Dashboard;
