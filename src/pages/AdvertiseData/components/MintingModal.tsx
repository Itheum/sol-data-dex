import React, { Dispatch, SetStateAction, memo, useState, useEffect } from "react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  CloseButton,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  SkeletonText,
  Spinner,
  Stack,
  Text,
  useColorMode,
  VStack,
  Flex,
  Tag,
  TagLabel,
  Wrap,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import NftMediaComponent from "components/NftMediaComponent";

type MintingModalProps = {
  isOpen: boolean;
  errDataNFTStreamGeneric: any;
  saveProgress: Record<any, any>;
  dataNFTImg: string;
  dataNFTTraits: any;
  mintingSuccessful: boolean;
  // makePrimaryNFMeIdSuccessful: boolean;
  isNFMeIDMint: boolean;
  isAutoVaultInProgress: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  closeProgressModal: () => void;
  bondingTxHasFailed?: boolean;
  sendSolanaBondingTx?: () => void;
  isFreeMint?: boolean;
};

export const MintingModal: React.FC<MintingModalProps> = memo((props) => {
  const {
    isOpen,
    errDataNFTStreamGeneric,
    saveProgress,
    dataNFTImg,
    dataNFTTraits,
    mintingSuccessful,
    // makePrimaryNFMeIdSuccessful,
    isNFMeIDMint,
    isAutoVaultInProgress,
    setIsOpen,
    closeProgressModal,
    bondingTxHasFailed,
    sendSolanaBondingTx,
    isFreeMint,
  } = props;
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const onClose = () => {
    setIsOpen(false);
  };
  const [localMintJustClicked, setLocalMintJustClicked] = useState(false);
  const { connected: isSolWalletConnected } = useWallet();

  useEffect(() => {
    setLocalMintJustClicked(false);
  }, []);

  useEffect(() => {
    // if there was an error, let user try again if they want
    if (localMintJustClicked) {
      setLocalMintJustClicked(false);
    }
  }, [errDataNFTStreamGeneric]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnEsc={false} closeOnOverlayClick={false} blockScrollOnMount={false} size={{ base: "sm", md: "lg" }}>
      <ModalOverlay />
      <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
        <ModalHeader>{isNFMeIDMint ? "NFMe ID" : "Data NFT Collection"} Minting Progress</ModalHeader>
        {mintingSuccessful && <ModalCloseButton />}
        <ModalBody pb={6}>
          <Stack spacing={5}>
            {!mintingSuccessful && (
              <>
                <HStack>
                  <Box w={6}>{(!saveProgress.s1 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}</Box>
                  <Text fontSize="lg">Generating private and encrypted data stream</Text>
                </HStack>

                <HStack>
                  <Box w={6}>{(!saveProgress.s2 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}</Box>
                  <Text fontSize="lg">Building unique NFT image and traits based on data</Text>
                </HStack>

                <HStack>
                  <Box w={6}>{(!saveProgress.s3 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}</Box>
                  <Text fontSize="lg">Loading metadata to durable decentralized storage {isFreeMint ? " and minting your NFMe ID" : ""}</Text>
                </HStack>

                {!isFreeMint && (
                  <HStack>
                    <Box w={6}>{(!saveProgress.s4 && <Spinner size="md" />) || <CheckCircleIcon w={6} h={6} />}</Box>
                    <Text fontSize="lg">
                      Minting your {isNFMeIDMint ? "NFMe ID" : "Data NFT"}, bonding $ITHEUM to generate your liveliness staking rewards{" "}
                      {isAutoVaultInProgress ? "and setting it as your vault" : ""}
                    </Text>
                  </HStack>
                )}
              </>
            )}

            {!mintingSuccessful ? (
              <Flex flexDirection={{ base: "column", md: "row" }} alignItems="center">
                <Box w="255px">
                  <Skeleton w="200px" h="200px" margin="auto" rounded="lg" />
                </Box>

                <Box w="180px" mt={{ base: "3", md: "0" }}>
                  <Box>
                    <SkeletonText noOfLines={4} spacing="2" skeletonHeight="2" />
                    <SkeletonText mt="4" noOfLines={4} spacing="2" skeletonHeight="2" />
                  </Box>
                </Box>
              </Flex>
            ) : (
              <>
                <Flex flexDirection={{ base: "column", md: "row" }} alignItems="center">
                  <Box w="255px">
                    <NftMediaComponent imageUrls={[dataNFTImg]} imageHeight={"200px"} imageWidth={"200px"} borderRadius="md" />
                  </Box>

                  <Box w="220px" mt={{ base: "3", md: "0" }}>
                    {dataNFTTraits && (
                      <Box>
                        <Text fontSize="sm" mb={2} fontWeight="bold">
                          Traits:
                        </Text>
                        <Wrap spacing={2}>
                          {dataNFTTraits
                            .filter((i: any) => i.trait_type !== "Creator")
                            .map((trait: any) => (
                              <Tag size="sm" variant="solid" colorScheme="teal" key={trait.trait_type}>
                                <TagLabel>
                                  {trait.trait_type} : {trait.value}
                                </TagLabel>
                              </Tag>
                            ))}
                        </Wrap>
                      </Box>
                    )}
                  </Box>
                </Flex>

                {dataNFTImg && (
                  <Text fontSize="xs" align="center" mt={{ md: "-5" }}>
                    Image and traits were created using the unique data signature (it&apos;s one of a kind!)
                  </Text>
                )}
              </>
            )}

            {/* Mint + Bond: NF Minting was a success but the bonding steps failed */}
            <>
              {!isFreeMint && mintingSuccessful && bondingTxHasFailed && (
                <Box textAlign="center" mt={4}>
                  <Text fontSize="lg" colorScheme="teal" color="teal.200" mb={2}>
                    Note: You can only complete the bonding step here.
                  </Text>
                  <Button
                    colorScheme="teal"
                    variant="solid"
                    onClick={() => {
                      sendSolanaBondingTx ? sendSolanaBondingTx() : console.error("Retry is not possible.");
                    }}>
                    Retry Bonding
                  </Button>
                </Box>
              )}
            </>

            {/* Mint + Bond: NF Minting AND bonding was a success. So we show the CTAs */}
            <>
              {!isFreeMint && mintingSuccessful && !bondingTxHasFailed && (
                <Box textAlign="center" mt="2">
                  <Alert status="success" rounded="md">
                    <Text fontSize="lg" colorScheme="teal" m="auto">
                      Success! {isNFMeIDMint ? "NFMe ID" : "Data NFT"} Minted and {isSolWalletConnected ? "bonded" : "set as your NFMe ID"}
                    </Text>
                  </Alert>
                  <HStack mt="4">
                    <Button
                      colorScheme="teal"
                      ml="auto"
                      onClick={() => {
                        navigate("/liveliness");
                      }}>
                      Visit {`"Liveliness"`} to see it!
                    </Button>
                    <Button
                      colorScheme="teal"
                      variant="outline"
                      mr="auto"
                      onClick={() => {
                        closeProgressModal();
                        onClose();
                      }}>
                      Close & Return
                    </Button>
                  </HStack>
                </Box>
              )}
            </>

            {/* Free Mint : NF Minting was a success. So we show the CTAs */}
            <>
              {isFreeMint && mintingSuccessful && (
                <Box textAlign="center" mt="2">
                  <Alert status="success" rounded="md">
                    <Text fontSize="lg" colorScheme="teal">
                      Success! Your unique NFMe ID was minted.
                    </Text>
                  </Alert>
                  <Flex mt="4" flexDir={"column"} alignItems="center">
                    <Button
                      colorScheme="teal"
                      onClick={() => {
                        navigate("/liveliness");
                      }}>
                      Visit {`"Wallet"`} to see it!
                    </Button>
                    <Text textAlign="center" my="2">
                      Or, head back to your dashboard for next steps to join the AI Data Workforce.
                    </Text>
                    <Button
                      colorScheme="teal"
                      onClick={() => {
                        navigate("/dashboard");
                      }}>
                      Go to Dashboard
                    </Button>
                    <Text my="1">OR</Text>
                    <Button
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => {
                        closeProgressModal();
                        onClose();
                      }}>
                      Close & Return
                    </Button>
                  </Flex>
                </Box>
              )}
            </>

            {/* {isAutoVault ? ( */}
            {/* <> */}
            {/* {mintingSuccessful && makePrimaryNFMeIdSuccessful ? ( */}
            {/* {mintingSuccessful ? (
                  <Box textAlign="center" mt="2">
                    <Alert status="success" rounded="md">
                      <Text fontSize="lg" colorScheme="teal">
                        Success! {isNFMeIDMint ? "NFMe ID" : "Data NFT"} Minted and {isSolWalletConnected ? "bonded" : "set as your NFMe ID"}.
                      </Text>
                    </Alert>
                    <HStack mt="4">
                      <Button
                        colorScheme="teal"
                        ml="auto"
                        onClick={() => {
                          navigate("/liveliness");
                        }}>
                        Visit {`"Liveliness"`} to see it!
                      </Button>
                      <Button
                        colorScheme="teal"
                        variant="outline"
                        mr="auto"
                        onClick={() => {
                          closeProgressModal();
                          onClose();
                        }}>
                        Close & Return
                      </Button>
                    </HStack>
                  </Box>
                ) : (
                  mintingSuccessful &&
                  bondingTxHasFailed && (
                    <Box textAlign="center" mt={4}>
                      <Text fontSize="lg" colorScheme="teal" color="teal.200" mb={2}>
                        Note: You can only complete the bonding step here.
                      </Text>
                      <Button
                        colorScheme="teal"
                        variant="solid"
                        onClick={() => {
                          sendSolanaBondingTx ? sendSolanaBondingTx() : console.error("Retry is not possible.");
                        }}>
                        Retry Bonding
                      </Button>
                    </Box>
                  )
                )} */}
            {/* </> */}
            {/* ) : ( */}
            {/* <>
                {mintingSuccessful && (
                  <Box textAlign="center" mt="2">
                    <Alert status="success" rounded="md">
                      <Text fontSize="lg" colorScheme="teal">
                        Success! Your {isNFMeIDMint ? "NFMe ID" : "Data NFT"} has been minted.
                      </Text>
                    </Alert>
                    <HStack mt="4">
                      <Button
                        colorScheme="teal"
                        ml="auto"
                        onClick={() => {
                          navigate("/datanfts/wallet");
                        }}>
                        Visit your {"Wallet"} to see it!
                      </Button>
                      <Button
                        colorScheme="teal"
                        variant="outline"
                        mr="auto"
                        onClick={() => {
                          closeProgressModal();
                          onClose();
                        }}>
                        Close & Return
                      </Button>
                    </HStack>
                  </Box>
                )}
              </> */}
            {/* )} */}

            {errDataNFTStreamGeneric && (
              <Alert status="error" rounded="md">
                <Stack>
                  <AlertTitle fontSize="md">
                    <AlertIcon mb={2} />
                    Process Error
                  </AlertTitle>
                  {errDataNFTStreamGeneric.message && <AlertDescription fontSize="md">{errDataNFTStreamGeneric.message}</AlertDescription>}
                  <CloseButton
                    position="absolute"
                    right="8px"
                    top="8px"
                    onClick={() => {
                      closeProgressModal();
                      onClose();
                    }}
                  />
                </Stack>
              </Alert>
            )}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});
