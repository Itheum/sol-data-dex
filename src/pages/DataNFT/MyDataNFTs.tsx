import React, { useEffect, useState } from "react";
import { Icon } from "@chakra-ui/icons";
import {
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
  ListItem,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { FaBrush } from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { NoDataHere } from "components/Sections/NoDataHere";
import WalletDataNftSol from "components/SolanaNfts/WalletDataNftSol";
import { ConfirmationDialog } from "components/UtilComps/ConfirmationDialog";
import useThrottle from "components/UtilComps/UseThrottle";
import { useNftsStore } from "store/nfts";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { itheumSolPreaccess } from "libs/Solana/SolViewData";
import { createBondTransaction, getNftMetaForDelayedBonding } from "libs/Solana/utils";
import { Commitment, PublicKey, Transaction, TransactionConfirmationStrategy } from "@solana/web3.js";
import { BONDING_PROGRAM_ID, SOLANA_EXPLORER_URL } from "libs/Solana/config";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { useAccountStore, useMintStore } from "store";
import BigNumber from "bignumber.js";
import { CNftSolPostMintMetaType } from "@itheum/sdk-mx-data-nft/out";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export default function MyDataNFTs({ tabState }: { tabState: number }) {
  const { colorMode } = useColorMode();
  const { publicKey: solPubKey, sendTransaction, signMessage } = useWallet();
  const navigate = useNavigate();
  const { solNfts, bondedNftIds } = useNftsStore();
  const [reEstablishBondConfirmationWorkflow, setReEstablishBondConfirmationWorkflow] = useState<{ dataNftId: string }>();
  const [bondingInProgress, setBondingInProgress] = useState<boolean>(false);
  const [solBondingTxHasFailed, setSolBondingTxHasFailed] = useState<boolean>(false);
  const [solanaBondTransaction, setSolanaBondTransaction] = useState<Transaction | undefined>(undefined);
  const { connection } = useConnection();
  const toast = useToast();
  const { networkConfiguration } = useNetworkConfiguration();
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);
  const itheumBalance = useAccountStore((state) => state.itheumBalance);
  const lockPeriod = useMintStore((state) => state.lockPeriodForBond);

  useEffect(() => {
    // if (tabState == 2) {
    //   // we are in liveliness, and if user is not logged in -- then we take them to liveliness homepage
    //   if (!solPubKey) {
    //     console.log("User not logged in so take them to home page");
    //     navigate("/NFMeID");
    //   }
    // }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    console.log("bondedNftIds");
    console.log(bondedNftIds);
  }, []);

  useEffect(() => {
    if (solanaBondTransaction) sendSolanaBondingTx();
  }, [solanaBondTransaction]);

  const onChangeTab = useThrottle((newTabState: number) => {
    navigate(`/datanfts/${newTabState === 2 ? "claim" : "wallet"}`);
    // navigate(`/datanfts/wallet${newTabState === 2 ? "/liveliness" : ""}`);
  }, /* delay: */ 500);

  const walletTabs = [
    {
      tabName: "Your Data NFT(s)",
      icon: FaBrush,
      isDisabled: false,
      pieces: solNfts?.length,
    },
    {
      tabName: "Claim Data NFT(s) - Coming Soon",
      icon: MdLockOutline,
      isDisabled: true,
    },
  ];

  const getOnChainNFTs = async () => {
    return [];
  };

  async function handleReEstablishBondClick() {
    try {
      if (!solPubKey || !reEstablishBondConfirmationWorkflow) {
        throw new Error("no solpublic key");
      }

      setBondingInProgress(true);

      // get a signature
      const { signatureNonce, solSignature } = await getAccessNonceAndSign();

      // get the meta from the API
      const mintMeta: CNftSolPostMintMetaType = await getNftMetaForDelayedBonding(
        reEstablishBondConfirmationWorkflow.dataNftId,
        solPubKey.toBase58(),
        solSignature,
        signatureNonce
      );

      if (mintMeta && mintMeta.error) {
        console.log(mintMeta);
        setSolBondingTxHasFailed(true);
        setBondingInProgress(false);
      } else {
        const bondTransaction = await createBondTransaction(mintMeta, solPubKey, connection, true);

        if (!bondTransaction) {
          setSolBondingTxHasFailed(true);
          setBondingInProgress(false);
        } else {
          setSolanaBondTransaction(bondTransaction);
        }
      }
    } catch (error) {
      console.error("Transaction withdraw failed:", error);
    }
  }

  const getAccessNonceAndSign = async () => {
    const preAccessNonce = await itheumSolPreaccess();
    const message = new TextEncoder().encode(preAccessNonce);

    if (signMessage === undefined) {
      throw new Error("signMessage is undefined");
    }

    const signature = await signMessage(message);
    // const encodedSignature = Buffer.from(signature).toString("hex");
    const encodedSignature = bs58.encode(signature); // the marshal needs it in bs58

    if (!preAccessNonce || !signature || !solPubKey) {
      throw new Error("Missing data for viewData");
    }

    return { signatureNonce: preAccessNonce, solSignature: encodedSignature };
  };

  const sendSolanaBondingTx = async () => {
    if (solanaBondTransaction) {
      try {
        setSolBondingTxHasFailed(false);

        const result = await sendAndConfirmTransaction({ transaction: solanaBondTransaction, customErrorMessage: "Failed to send the bonding transaction" });

        if (result) {
          updateItheumBalance(itheumBalance - BigNumber(lockPeriod[0]?.amount).toNumber());

          setBondingInProgress(true);
          setReEstablishBondConfirmationWorkflow(undefined);
        }
      } catch (err) {
        setSolBondingTxHasFailed(true);
      }
    } else {
      setSolBondingTxHasFailed(true);
    }
  };

  async function sendAndConfirmTransaction({
    transaction,
    customErrorMessage = "Transaction failed",
  }: {
    transaction: Transaction;
    customErrorMessage?: string;
  }) {
    try {
      if (solPubKey === null) {
        throw new Error("Wallet not connected");
      }

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = solPubKey;

      const txSignature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        preflightCommitment: "finalized",
      });

      const strategy: TransactionConfirmationStrategy = {
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      };

      const confirmationPromise = connection.confirmTransaction(strategy, "finalized" as Commitment);

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

  return (
    <>
      <Stack>
        <Heading size="xl" fontFamily="Clash-Medium" mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          Data NFT Wallet
        </Heading>
        <Heading size="1rem" opacity=".7" fontFamily="Satoshi-Medium" fontWeight="light" px={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          Manage the Data NFTs you created or purchased from the peer-to-peer Data NFT Marketplace.
        </Heading>

        <Tabs pt={10} index={tabState - 1}>
          <TabList overflowX={{ base: "scroll", md: "scroll", xl: "unset", "2xl": "unset" }} maxW="100%" overflowY="hidden">
            {walletTabs.map((tab, index) => {
              return (
                <Tab
                  key={index}
                  isDisabled={tab.isDisabled}
                  p={{ base: "3", md: "0" }}
                  _selected={{ borderBottom: "5px solid", borderBottomColor: "teal.200" }}
                  onClick={() => onChangeTab(index + 1)}
                  mx={"auto"}>
                  <Flex
                    height={"100%"}
                    flexDirection={{ base: "column", md: "row" }}
                    alignItems={{ base: "center", md: "center" }}
                    justify={{ md: "center" }}
                    py={3}
                    overflow="hidden">
                    <Icon as={tab.icon} mx={2} size="0.95rem" textColor={colorMode === "dark" ? "white" : "black"} />
                    <Text fontSize="lg" fontWeight="medium" color={colorMode === "dark" ? "white" : "black"} w="max-content">
                      {tab.tabName}
                    </Text>
                    <Text fontSize="sm" px={2} color={colorMode == "dark" ? "whiteAlpha.800" : "blackAlpha.800"}>
                      {tab.pieces}
                    </Text>
                  </Flex>
                </Tab>
              );
            })}
          </TabList>
          <TabPanels>
            {/* Your Data NFTs */}
            <TabPanel mt={2} width={"full"}>
              {tabState === 1 && solNfts?.length > 0 ? (
                <SimpleGrid
                  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                  spacingY={4}
                  mx={{ base: 0, "2xl": "24 !important" }}
                  mt="5 !important"
                  justifyItems={"center"}>
                  {solNfts.map((item, index) => (
                    <WalletDataNftSol
                      key={index}
                      index={index}
                      solDataNft={item}
                      onReEstablishBond={(dataNftId: string) => {
                        setReEstablishBondConfirmationWorkflow({ dataNftId: dataNftId });
                      }}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Flex onClick={getOnChainNFTs}>
                  <NoDataHere />
                </Flex>
              )}
            </TabPanel>

            {/* Claim Data NFTs */}
            <TabPanel mt={2} width={"full"}>
              {tabState === 2 && <NoDataHere />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* ReEstablish Bond Dialog */}
      <>
        <ConfirmationDialog
          isOpen={typeof reEstablishBondConfirmationWorkflow !== "undefined"}
          onCancel={() => {
            setSolBondingTxHasFailed(false);
            setBondingInProgress(false);
            setReEstablishBondConfirmationWorkflow(undefined);
          }}
          onProceed={() => {
            setSolBondingTxHasFailed(false);
            setBondingInProgress(false);
            handleReEstablishBondClick();
          }}
          bodyContent={
            <>
              {bondingInProgress ? (
                <>Please wait.....</>
              ) : (
                <>
                  {solBondingTxHasFailed ? (
                    <>FAILED!</>
                  ) : (
                    <>
                      <Text fontSize="sm" pb={3} opacity=".8">
                        Lets Establish a bond for Data NFT ID {reEstablishBondConfirmationWorkflow?.dataNftId}
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" pb={3} opacity="1">
                        This Data NFT does not have an active {`"Bond"`}, so you can choose to bond XX $ITHEUM tokens on it and in return boost your web3
                        Reputation (Liveliness), in return, you earn staking rewards for your bond.
                      </Text>
                      <Text mb="2" fontSize="sm">
                        There are a few items to consider before you proceed with this:
                      </Text>
                      <UnorderedList p="2" fontSize="sm">
                        <ListItem>You need to bond {BigNumber(lockPeriod[0]?.amount).toNumber()} $ITHEUM for a minimum XX months</ListItem>
                        <ListItem>After the minimum {lockPeriod[0]?.lockPeriod} period, you can withdraw your full amount</ListItem>
                        <ListItem>If you withdraw early, you will have a XX% penalty</ListItem>
                        <ListItem>For the period of the bond, you earn staking rewards of upto 40% APR</ListItem>
                        <ListItem>If you proceed, your have read and agree to these terms of use</ListItem>
                      </UnorderedList>

                      <Text mt="5">With the above in mind, are your SURE you want to proceed to with Bond?</Text>
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
                  proceedBtnTxt: "Proceed with Bond",
                  cancelBtnText: "Cancel and Close",
                  proceedBtnColorScheme: "red",
                }
              : { title: "Bonding...", proceedBtnTxt: "", cancelBtnText: "", proceedBtnColorScheme: "blue" }
          }
        />
      </>
    </>
  );
}
