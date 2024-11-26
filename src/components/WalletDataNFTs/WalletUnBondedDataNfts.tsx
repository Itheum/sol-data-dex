import React, { useState, useEffect } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Link,
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Skeleton,
  UnorderedList,
  ListItem,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { CNftSolPostMintMetaType } from "@itheum/sdk-mx-data-nft/out";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { MdOutlineInfo } from "react-icons/md";
import NftMediaComponent from "components/NftMediaComponent";
import { ConfirmationDialog } from "components/UtilComps/ConfirmationDialog";
import ShortAddress from "components/UtilComps/ShortAddress";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { DEFAULT_NFT_IMAGE } from "libs/mxConstants";
import { SOLANA_EXPLORER_URL } from "libs/Solana/config";
import { createBondTransaction, getNftMetaForDelayedBonding, getOrCacheAccessNonceAndSignature, sendAndConfirmTransaction } from "libs/Solana/utils";
import { transformDescription, timeUntil, sleep } from "libs/utils";
import { useAccountStore, useMintStore } from "store";
import { useNftsStore } from "store/nfts";

interface WalletUnBondedDataNftsProps {
  index: number;
  solDataNft: DasApiAsset;
  onShowBondingSuccessModal: any;
}

const WalletUnBondedDataNfts: React.FC<WalletUnBondedDataNftsProps> = ({ index, solDataNft, onShowBondingSuccessModal }) => {
  const { networkConfiguration } = useNetworkConfiguration();
  const [reEstablishBondConfirmationWorkflow, setReEstablishBondConfirmationWorkflow] = useState<{ dataNftId: string }>();
  const { publicKey: userPublicKey, sendTransaction, signMessage } = useWallet();
  const [bondingInProgress, setBondingInProgress] = useState<boolean>(false);
  const [solBondingTxHasFailedMsg, setSolBondingTxHasFailedMsg] = useState<string | undefined>(undefined);
  const [solanaBondTransaction, setSolanaBondTransaction] = useState<Transaction | undefined>(undefined);
  const { connection } = useConnection();
  const toast = useToast();
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);
  const itheumBalance = useAccountStore((state) => state.itheumBalance);
  const lockPeriod = useMintStore((state) => state.lockPeriodForBond);
  const { bondedDataNftIds, updateBondedDataNftIds } = useNftsStore();
  const { currentMaxApr } = useMintStore();

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  // useEffect(() => {
  //   onBondingSuccessCTAModalOpen();
  // }, []);

  useEffect(() => {
    if (solanaBondTransaction) {
      sendSolanaBondingTx();
    }
  }, [solanaBondTransaction]);

  async function handleReEstablishBondClick() {
    try {
      if (!userPublicKey || !reEstablishBondConfirmationWorkflow) {
        throw new Error("no sol public key");
      }

      setBondingInProgress(true);

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

      // get the meta from the API
      const mintMeta: CNftSolPostMintMetaType = await getNftMetaForDelayedBonding(
        reEstablishBondConfirmationWorkflow.dataNftId,
        userPublicKey.toBase58(),
        usedPreAccessSignature,
        usedPreAccessNonce
      );

      if (mintMeta && mintMeta.error) {
        console.log(mintMeta);
        setSolBondingTxHasFailedMsg("Error fetching the nft compressed nft metadata, which is needed for the bond");
        setBondingInProgress(false);
      } else {
        const bondTransaction = await createBondTransaction(mintMeta, userPublicKey, connection, true);

        if (!bondTransaction) {
          setSolBondingTxHasFailedMsg("Error creating the bond transaction");
          setBondingInProgress(false);
        } else {
          setSolanaBondTransaction(bondTransaction);
        }
      }
    } catch (error) {
      console.error("Transaction withdraw failed:", error);
    }
  }

  const sendSolanaBondingTx = async () => {
    if (solanaBondTransaction) {
      try {
        setSolBondingTxHasFailedMsg(undefined);

        const result = await executeTransaction({ transaction: solanaBondTransaction, customErrorMessage: "Failed to send the bonding transaction" });

        if (result) {
          updateItheumBalance(itheumBalance - BigNumber(lockPeriod[0]?.amount).toNumber());

          setBondingInProgress(false);

          if (reEstablishBondConfirmationWorkflow) {
            onShowBondingSuccessModal(); // ask the parent to show the success model CTA

            await sleep(2);

            // we can assume the bonding passed here, so to keep it simple (or else we need to sync a lot of state to store), we re just remove the dataNftId from global store BondedDataNftIds
            const _bondedDataNftIds: string[] = [...bondedDataNftIds];
            _bondedDataNftIds.push(reEstablishBondConfirmationWorkflow.dataNftId);
            updateBondedDataNftIds(_bondedDataNftIds);
          }

          setReEstablishBondConfirmationWorkflow(undefined);
        }
      } catch (err) {
        setSolBondingTxHasFailedMsg(err?.toString());
      }
    } else {
      setSolBondingTxHasFailedMsg("bond transaction is not found");
    }
  };

  async function executeTransaction({ transaction, customErrorMessage = "Transaction failed" }: { transaction: Transaction; customErrorMessage?: string }) {
    try {
      if (!userPublicKey) {
        throw new Error("Wallet not connected");
      }

      const { confirmationPromise, txSignature } = await sendAndConfirmTransaction({ userPublicKey, connection, transaction, sendTransaction });

      // const latestBlockhash = await connection.getLatestBlockhash();
      // transaction.recentBlockhash = latestBlockhash.blockhash;
      // transaction.feePayer = userPublicKey;

      // const txSignature = await sendTransaction(transaction, connection, {
      //   skipPreflight: true,
      //   preflightCommitment: "finalized",
      // });

      // const strategy: TransactionConfirmationStrategy = {
      //   signature: txSignature,
      //   blockhash: latestBlockhash.blockhash,
      //   lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      // };

      // const confirmationPromise = connection.confirmTransaction(strategy, "finalized" as Commitment);

      toast.promise(
        confirmationPromise.then((response) => {
          if (response.value.err) {
            console.error("Transaction failed:", response.value);
            throw new Error(customErrorMessage);
          }
        }),
        {
          success: {
            title: "Transaction Confirmed",
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          error: {
            title: customErrorMessage,
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          loading: { title: "Processing Transaction", description: "Please wait...", colorScheme: "blue" },
        }
      );

      const result = await confirmationPromise;

      if (result.value.err) {
        return false;
      }

      return txSignature;
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: customErrorMessage + " : " + (error as Error).message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });

      throw error;
    }
  }

  const amountOfTime = lockPeriod.length > 0 ? timeUntil(lockPeriod[0]?.lockPeriod) : { count: -1, unit: "-1" };

  return (
    <>
      <Skeleton fitContent={true} isLoaded={true} borderRadius="16px" display="flex" alignItems="center" justifyContent="center">
        <Box
          key={index}
          w="275px"
          mx="3 !important"
          border="1px solid transparent"
          borderColor="#00C79740"
          borderRadius="16px"
          mb="1rem"
          position="relative"
          pb="1rem">
          <NftMediaComponent
            imageUrls={[solDataNft.content.links && solDataNft.content.links["image"] ? (solDataNft.content.links["image"] as string) : DEFAULT_NFT_IMAGE]}
            autoSlide
            imageHeight="236px"
            imageWidth="236px"
            autoSlideInterval={Math.floor(Math.random() * 6000 + 6000)} // random number between 6 and 12 seconds
            onLoad={() => {}}
            openNftDetailsDrawer={() => {
              window.open(solDataNft.content.json_uri, "_blank");
            }}
            marginTop="1.5rem"
            borderRadius="16px"
          />
          <Flex mx={6} direction="column">
            <Text fontWeight="semibold" fontSize="lg" mt="1.5" noOfLines={1}>
              {solDataNft.content.metadata.name}
            </Text>
            <Box my="2">
              <Button
                w={"100%"}
                size={"sm"}
                p={5}
                colorScheme="teal"
                onClick={() => {
                  setReEstablishBondConfirmationWorkflow({ dataNftId: solDataNft.id });
                }}>
                Bond To Get Liveliness <br />+ Staking Rewards
              </Button>
              {/* <br />
              ID: {solDataNft.id}
              <br />
              Length {solDataNft.grouping.length}
              <br />
              Collection {solDataNft.grouping[0].group_value} */}
            </Box>
            <Link
              onClick={() => window.open(`${SOLANA_EXPLORER_URL}address/${solDataNft.id}?cluster=${networkConfiguration}`, "_blank")}
              fontSize="md"
              color="#929497">
              <ShortAddress address={solDataNft.id} fontSize="lg" tooltipLabel="Check Data Nft on explorer" /> <ExternalLinkIcon ml={1} mt={-2} />
            </Link>{" "}
            <Box>
              <Popover trigger="hover" placement="auto">
                <PopoverTrigger>
                  <Flex flexGrow="1" mt={4}>
                    <Text fontSize="md" color="#929497" noOfLines={2} w="100%" h="10">
                      {solDataNft.content.metadata.description && transformDescription(solDataNft.content.metadata.description)}
                    </Text>
                  </Flex>
                </PopoverTrigger>
                <PopoverContent mx="2" width="220px" mt="-7">
                  <PopoverHeader fontWeight="semibold" fontSize="lg">
                    Description
                  </PopoverHeader>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverBody>
                    <Text fontSize="md" mt="1" color="#929497">
                      {solDataNft.content.metadata.description ? transformDescription(solDataNft.content.metadata.description) : "No description available"}
                    </Text>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Box>
            {solDataNft.creators && (
              <Box mt={3} color="#8c8f92d0" fontSize="sm" display="flex" alignItems="start">
                Creator{solDataNft.creators.length > 1 && "s"}:&nbsp;{" "}
                <Flex w={"full"} alignItems="center" key={index} flexDirection={"column"} maxH="100px" overflowY="auto" scrollBehavior={"auto"}>
                  {solDataNft.creators.map((creator, idx) => (
                    <Link
                      fontSize="sm"
                      key={idx}
                      display="flex"
                      alignItems="center"
                      isExternal
                      href={`${SOLANA_EXPLORER_URL}address/${creator.address}?cluster=${networkConfiguration}`}>
                      <ShortAddress address={creator.address} fontSize="sm" tooltipLabel="Check on explorer" />{" "}
                      <MdOutlineInfo style={{ marginLeft: "5px", color: "#00c797" }} fontSize="lg" />
                    </Link>
                  ))}
                </Flex>
              </Box>
            )}
          </Flex>
        </Box>
      </Skeleton>

      {/* Delayed Bond Dialog */}
      <>
        <ConfirmationDialog
          isOpen={typeof reEstablishBondConfirmationWorkflow !== "undefined"}
          onCancel={() => {
            setSolBondingTxHasFailedMsg(undefined);
            setBondingInProgress(false);
            setReEstablishBondConfirmationWorkflow(undefined);
          }}
          onProceed={() => {
            setSolBondingTxHasFailedMsg(undefined);
            setBondingInProgress(false);
            handleReEstablishBondClick();
          }}
          bodyContent={
            <>
              {bondingInProgress ? (
                <Flex w="100%" h="5rem" justifyContent="center" alignItems="center">
                  <Spinner size="xl" color="teal.200" />
                </Flex>
              ) : (
                <>
                  {solBondingTxHasFailedMsg ? (
                    <Alert status="error" mt={5} rounded="md" mb={8}>
                      <AlertIcon />
                      <Box>
                        <Text>{solBondingTxHasFailedMsg} </Text>
                      </Box>
                    </Alert>
                  ) : (
                    <>
                      <Text fontSize="sm" pb={3} opacity=".8">
                        {`Let's`} establish a bond for Data NFT ID {reEstablishBondConfirmationWorkflow?.dataNftId}
                      </Text>
                      <Text fontWeight="bold" pb={3} opacity="1">
                        This Data NFT has no active {`"Bond."`} You can bond {BigNumber(lockPeriod[0]?.amount).toNumber()} $ITHEUM to boost your Web3 Reputation
                        (Liveliness) and earn staking rewards (up to {currentMaxApr}% APR). Key points:
                      </Text>

                      <UnorderedList p="2">
                        <ListItem>Minimum bonding period: {`${lockPeriod[0]?.lockPeriod} ${amountOfTime?.unit}`}</ListItem>
                        <ListItem>Full amount is withdrawable after the minimum period.</ListItem>
                        <ListItem>Early withdrawals incur a penalty.</ListItem>
                      </UnorderedList>

                      <Text mt="5">
                        By proceeding, you confirm {`you've`} read and agree to the{" "}
                        <Link
                          href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/liveliness-bonding-penalties-and-slashing-terms"
                          isExternal
                          rel="noreferrer"
                          color="teal.200">
                          bonding terms
                        </Link>
                        . Are you sure you want to bond?
                      </Text>
                    </>
                  )}
                </>
              )}
            </>
          }
          dialogData={
            !bondingInProgress
              ? {
                  title: "Bond ITHEUM tokens to get more Liveliness?",
                  proceedBtnTxt: solBondingTxHasFailedMsg ? "" : "Proceed with Bond",
                  cancelBtnText: solBondingTxHasFailedMsg ? "Cancel and Try Again" : "Cancel and Close",
                  proceedBtnColorScheme: "teal",
                }
              : { title: "Bonding, please wait...", proceedBtnTxt: "", cancelBtnText: "" }
          }
        />
      </>
    </>
  );
};

export default WalletUnBondedDataNfts;
