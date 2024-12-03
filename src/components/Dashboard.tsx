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
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { BsDot } from "react-icons/bs";
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
import { motion, Variants } from "framer-motion";
import { keyframes } from "@emotion/react";

const food: [string, number, number][] = [
  ["🍅", 340, 10],
  ["🍊", 20, 40],
  ["🍋", 60, 90],
  ["🍐", 80, 120],
  ["🍏", 100, 140],
  ["🫐", 205, 245],
  ["🍆", 260, 290],
  ["🍇", 290, 320],
];

const cardVariants: Variants = {
  offscreen: {
    y: 300,
  },
  onscreen: {
    y: 50,
    rotate: -10,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

const hue = (h: number) => `hsl(${h}, 100%, 50%)`;

interface Props {
  emoji: string;
  hueA: number;
  hueB: number;
}

function Card({ emoji, hueA, hueB }: Props) {
  const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`;
  // const background = `linear-gradient(180deg)`;

  return (
    <motion.div className="card-container" initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }}>
      <div className="splash" style={{ background }} />
      <motion.div className="card" variants={cardVariants}>
        {/* {emoji} */}
        <motion.img className="rounded-[.1rem] w-[250px] max-h-[250px] md:w-[310px] md:max-h-[310px] m-auto -z-1" src={nfMeIDVault} />
      </motion.div>
    </motion.div>
  );
}

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
  // const [freeNfMeIdClaimed, setFreeNfMeIdClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeMintMusicGiftIntroToAction, setFreeMintMusicGiftIntroToAction] = useState<boolean>(false);
  const [freeMintMusicGiftLoading, setFreeMintMusicGiftLoading] = useState<boolean>(false);
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeDropCheckNeededForBitz, setFreeDropCheckNeededForBitz] = useState<number>(0);
  const [freeDropCheckNeededForMusicGift, setFreeDropCheckNeededForMusicGift] = useState<number>(0);
  const [errFreeMintGeneric, setErrFreeMintGeneric] = useState<string | null>(null);
  const bitzBalance = useAccountStore((state) => state.bitzBalance);
  const cooldown = useAccountStore((state) => state.cooldown);
  const { updateAllDataNfts, bondedDataNftIds, bitzDataNfts } = useNftsStore();
  const { usersNfMeIdVaultBondId, updateFreeNfMeIdClaimed, freeNfMeIdClaimed } = useMintStore();
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SolEnvEnum.devnet : SolEnvEnum.mainnet;

  // conditional displays
  const [hasBitzNft, setHasBitzNft] = useState(false);

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
          // setFreeNfMeIdClaimed(true);
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
        setFreeMintBitzXpGameComingUp(false);
        onProgressModalClose();
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

  const animationKeyframes = keyframes`
  0% { transform: scale(1) rotate(0); border-radius: 20%; }
  25% { transform: scale(2) rotate(0); border-radius: 20%; }
  50% { transform: scale(2) rotate(270deg); border-radius: 50%; }
  75% { transform: scale(1) rotate(270deg); border-radius: 50%; }
  100% { transform: scale(1) rotate(0); border-radius: 20%; }
`;

  // const animation = `${animationKeyframes} 2s ease-in-out infinite`;

  // const background = `linear-gradient(306deg, ${hue(food[1])}, ${hue(food[2])})`;

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection="column" alignItems="center" justifyContent="center" backgroundColor={"xred.800"}>
      <Box width={"100%"} backgroundColor={"xblue.900"} padding={5} textAlign="center">
        {/* <motion.div className="card-container" initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }}>
          <div className="splash" style={{ background }} />
          <motion.div className="card" variants={cardVariants}>
            food[0]
          </motion.div>
        </motion.div> */}

        {/* {food.map(([emoji, hueA, hueB]) => (
          <Card emoji={emoji} hueA={hueA} hueB={hueB} key={emoji} />
        ))} */}

        {/* <Box
          as={motion.div}
          animation={animation}
          // not work: transition={{ ... }}
          padding="2"
          bgGradient="linear(to-l, #7928CA, #FF0080)"
          width="12"
          height="12"
          display="flex"
        /> */}
        {/* <motion.img transition={spring} className="rounded-[.1rem] w-[250px] max-h-[250px] md:w-[310px] md:max-h-[310px] m-auto -z-1" src={nfMeIDVault} /> */}

        <Heading as="h1" size="xl" fontFamily="Satoshi-Regular">
          Hello Human,
        </Heading>
        <Heading as="h1" size="lg" fontFamily="Satoshi-Regular" w="70%" textAlign="center" margin="auto">
          {/* Join the AI Data Workforce, prove your reputation,  creative data with me and get rewarded */}
          Join the AI Data Workforce, prove your reputation, co-create and accelerate creative data with me and get rewarded
        </Heading>
        {/* <Image
          as={motion.img}
          // animation={animation}
          margin="auto"
          boxSize="auto"
          w={{ base: "60%", md: "50%" }}
          src={nfMeIDVault}
          alt="Data NFTs Illustration"
        /> */}

        <Box display="inline-flex" mt="5">
          <Text>Pulsating orbs guide you to your next task</Text>
          <FocusOnThisEffect />
        </Box>
      </Box>
      <Box width={"100%"} backgroundColor={"xblue.800"} minH="400px" padding={5}>
        <Flex backgroundColor={"xblue.700"} flexDirection={["column", null, "row"]} gap={2} minH="90%">
          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Get Started for Free
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Flex flexDirection="column" backgroundColor={"xgray.500"} gap={2} p={2} borderBottom="1px solid" borderColor="teal.200">
                {!isUserLoggedIn && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center" fontFamily="Satoshi-Regular">
                  Login via Wallet
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
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                borderBottom="1px solid"
                borderColor="teal.200"
                opacity={!isUserLoggedIn ? 0.5 : "initial"}
                pointerEvents={!isUserLoggedIn ? "none" : "initial"}>
                {isUserLoggedIn && !hasBitzNft && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center">
                  Get a Free BiTz XP Data NFT
                </Heading>

                <Text textAlign="center">You can use it to collect XP by staying active</Text>

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

              {/* Get the NFMe ID airdrop -- ONLY ENABLE if the user has logged in & does NOT have a free NFMe ID already */}
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                borderBottom="1px solid"
                borderColor="teal.200"
                opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                {isUserLoggedIn && freeBitzClaimed && !freeNfMeIdClaimed && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center">
                  Get a Free NFMe ID
                </Heading>

                <Text textAlign="center">You can use it as your web3 identity for AI agents to verify</Text>

                <Button
                  m="auto"
                  colorScheme="teal"
                  variant={freeNfMeIdClaimed ? "solid" : "outline"}
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
            </Flex>
          </Box>

          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Grow Reputation
            </Heading>

            <Flex flexDirection="column" gap="3">
              {/* Play the BiTz Game -- ONLY ENABLE if the user has a BiTz Data NFT */}
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                borderBottom="1px solid"
                borderColor="teal.200"
                opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                pointerEvents={!hasBitzNft ? "none" : "initial"}>
                {!hasBitzNft && (
                  <Alert status="warning" rounded="md">
                    <AlertIcon />
                    {`You need to ${isUserLoggedIn ? "" : "login and "} get your free BiTz XP Data NFT first!`}
                  </Alert>
                )}

                {isUserLoggedIn && cooldown === 0 && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center">
                  Boost Your Proof-of-Activity
                </Heading>

                <Text textAlign="center">You need BiTz to vote to curate AI content. Earn BiTz by playing the game every few hours.</Text>

                <Button
                  m="auto"
                  display={{ base: "none", md: "inline-flex" }}
                  size={{ md: "md", xl: "md", "2xl": "lg" }}
                  p="8 !important"
                  onClick={() => onRemoteTriggerOfBiTzPlayModel(true)}
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
                  onClick={() => {
                    alert("Buy BiTz");
                  }}>
                  Buy BiTz
                </Button>
              </Flex>

              {/* Bond on your NFMe and Make it a vault -- ONLY ENABLE if the user has no bonded NFMe and a Vault */}
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                opacity={!isUserLoggedIn || !freeNfMeIdClaimed ? 0.5 : "initial"}
                pointerEvents={!isUserLoggedIn || !freeNfMeIdClaimed ? "none" : "initial"}>
                {isUserLoggedIn && hasBitzNft && freeNfMeIdClaimed && usersNfMeIdVaultBondId === 0 && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center">
                  Boost Your Proof-of-Reputation
                </Heading>

                <Text textAlign="center">Bond $ITHEUM on your NFMe ID vault, and grow your Liveliness to signal that you are {"Committed"}</Text>

                {/* check if the user has at least 1 bond */}
                <Button
                  m="auto"
                  colorScheme="teal"
                  variant={bondedDataNftIds.length > 0 ? "solid" : "outline"}
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || bondedDataNftIds.length > 0}
                  onClick={() => {
                    navigate("/datanfts/unbonded");
                  }}>
                  Bond $ITHEUM on your NFMe ID
                </Button>

                {/* check if the user has no vault and then allow them to action that */}
                <Button
                  m="auto"
                  colorScheme="teal"
                  variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  w="280px"
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
              </Flex>
            </Flex>
          </Box>

          <Box backgroundColor={"xgreen.700"} flex="1" border="1px solid" borderColor="teal.200" borderRadius="md" p={2}>
            <Heading fontFamily="Satoshi-Regular" color="teal.200" as="h2" size="lg" textAlign="center" mb={5}>
              Co-Create with AI
            </Heading>

            <Flex flexDirection="column" gap="3">
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
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
                <Text textAlign="center">
                  Help real-world music artists amplify their music with help from the Itheum Sigma AI Agent and your data curation
                </Text>
              </Flex>

              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                borderBottom="1px solid"
                borderColor="teal.200"
                opacity={!isUserLoggedIn || !hasBitzNft ? 0.5 : "initial"}
                pointerEvents={!isUserLoggedIn || !hasBitzNft ? "none" : "initial"}>
                <Text textAlign="center" fontSize="2xl">
                  1.
                </Text>

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
                  w="280px"
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
                  w="280px"
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
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                opacity={!hasBitzNft ? 0.5 : "initial"}
                pointerEvents={!hasBitzNft ? "none" : "initial"}>
                {!hasBitzNft && (
                  <Alert status="warning" rounded="md">
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

                <Text textAlign="center">Vote for content by gifting BiTz to music content created Itheum AI Music Creators</Text>

                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant="outline"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || bitzBalance === 0}
                  w="280px"
                  onClick={() => {
                    window.open(`${EXPLORER_APP_FOR_TOKEN[chainId]["nftunes"]}?artist-profile=waveborn-luminex&hl=sigma`, "_blank");
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

            {/* lets people top up their vault or withdraw rewards etc:  ONLY ENABLE if the user is Logged IN && has a BiTz Data NFT && has already setup a NFMeId Vault */}
            <Flex flexDirection="column" gap="3">
              <Flex
                flexDirection="column"
                backgroundColor={"xgray.500"}
                gap={2}
                p={2}
                opacity={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? 0.5 : "initial"}
                pointerEvents={!isUserLoggedIn || usersNfMeIdVaultBondId === 0 ? "none" : "initial"}>
                {usersNfMeIdVaultBondId === 0 && (
                  <Alert status="warning" rounded="md">
                    <AlertIcon />
                    {`You need to ${isUserLoggedIn ? "" : "login and "} have a NFMe ID that has been upgraded into a Vault first!!`}
                  </Alert>
                )}

                {isUserLoggedIn && usersNfMeIdVaultBondId > 0 && <FocusOnThisEffect />}

                <Heading as="h3" size="md" textAlign="center">
                  Liveliness Staking Rewards
                </Heading>

                <Text textAlign="center">Get a share of protocol rewards. Currently 40% APR on your NFMe Id Bonds</Text>

                {/* if the user has a vault allow them to top-up */}
                <Button
                  margin="auto"
                  colorScheme="teal"
                  variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                  w="280px"
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
                  w="280px"
                  isLoading={freeDropCheckLoading}
                  isDisabled={!isUserLoggedIn || usersNfMeIdVaultBondId === 0}
                  onClick={() => {
                    navigate("/liveliness?hl=claim");
                  }}>
                  Claim Rewards
                </Button>
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </Box>

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
                  {`BiTz`} are Itheum XP stored in a Data NFT in your wallet. Collect them to curate, power-up, and like data—and earn rewards! Your BiTz NFT is
                  your gateway to the Itheum Protocol and the Web3 AI Data Era {`we're`} enabling.
                </Text>

                {!errFreeMintGeneric && !freeNfMeIdClaimed && (
                  <>
                    {!freeMintBitzXpGameComingUp ? (
                      <Button
                        m="auto"
                        mt="5"
                        colorScheme="teal"
                        variant={usersNfMeIdVaultBondId > 0 ? "solid" : "outline"}
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        w="280px"
                        disabled={freeMintBitzXpLoading}
                        isLoading={freeMintBitzXpLoading}
                        onClick={() => {
                          handleFreeMintBitzXP();
                        }}>
                        LFG! Give Me My Airdrop!
                      </Button>
                    ) : (
                      <Alert status={"success"} mt={5} rounded="md" mb={8}>
                        <AlertIcon />
                        <Box>
                          <Text> Success! {`Let's`} get you for first BiTz XP, game coming up in 3,2,1...</Text>
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
                      <Button
                        m="auto"
                        mt="5"
                        colorScheme="teal"
                        variant={"outline"}
                        fontSize={{ base: "sm", md: "md" }}
                        size={{ base: "sm", lg: "lg" }}
                        w="280px"
                        disabled={freeMintMusicGiftLoading}
                        isLoading={freeMintMusicGiftLoading}
                        onClick={() => {
                          handleFreeMintMusicGift();
                        }}>
                        LFG! Give Me My Airdrop!
                      </Button>
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
                            w="280px"
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
    </Flex>
  );
};

function FocusOnThisEffect() {
  return (
    <Box className="absolute flex h-8 w-8">
      <Box className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></Box>
    </Box>
  );
}

export default Dashboard;
