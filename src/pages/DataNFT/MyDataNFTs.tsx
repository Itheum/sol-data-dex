import React, { useEffect, useState } from "react";
import { Icon } from "@chakra-ui/icons";
import { Flex, Heading, SimpleGrid, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useColorMode, useDisclosure } from "@chakra-ui/react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { FaBrush } from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import KeyActionSuccessCTAModel from "components/KeyActionSuccessCTAModel";
import { NoDataHere } from "components/Sections/NoDataHere";
import useThrottle from "components/UtilComps/UseThrottle";
import WalletAllDataNfts from "components/WalletDataNFTs/WalletAllDataNfts";
import WalletUnBondedDataNfts from "components/WalletDataNFTs/WalletUnBondedDataNfts";
import { NFME_ID_COLLECTION_ID } from "libs/config";
import { useNftsStore } from "store/nfts";

export default function MyDataNFTs({ tabState }: { tabState: number }) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const { allDataNfts, bondedDataNftIds } = useNftsStore();
  const [unBondedNfMeIds, setUnBondedNfMeIds] = useState<DasApiAsset[]>([]);
  const { isOpen: isBondingSuccessCTAModalOpen, onOpen: onBondingSuccessCTAModalOpen, onClose: onBondingCompleteCTAModalClose } = useDisclosure();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (allDataNfts.length > 0 && bondedDataNftIds.length > 0) {
      const _unBondedNeMeIdDataNfts = allDataNfts.filter(
        (solDataNft) => !bondedDataNftIds.includes(solDataNft.id) && solDataNft.grouping[0].group_value === NFME_ID_COLLECTION_ID
      );

      setUnBondedNfMeIds(_unBondedNeMeIdDataNfts);
    }
  }, [allDataNfts, bondedDataNftIds]);

  const onChangeTab = useThrottle((newTabState: number) => {
    navigate(`/datanfts/${newTabState === 2 ? "unbonded" : "wallet"}`);
  }, /* delay: */ 500);

  const walletTabs = [
    {
      tabName: "Your Data NFTs",
      icon: FaBrush,
      isDisabled: false,
      pieces: allDataNfts?.length,
    },
    {
      tabName: "Bond on Data NFTs",
      icon: MdLockOutline,
      isDisabled: false,
      pieces: unBondedNfMeIds?.length,
    },
  ];

  function handleShowBondingSuccessModal() {
    onBondingSuccessCTAModalOpen();
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
              {tabState === 1 && allDataNfts?.length > 0 ? (
                <SimpleGrid
                  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                  spacingY={4}
                  mx={{ base: 0, "2xl": "24 !important" }}
                  mt="5 !important"
                  justifyItems={"center"}>
                  {allDataNfts.map((item, index) => (
                    <WalletAllDataNfts key={index} index={index} solDataNft={item} />
                  ))}
                </SimpleGrid>
              ) : (
                <Flex>
                  <NoDataHere />
                </Flex>
              )}
            </TabPanel>

            {/* Un-bonded Data NFTs */}
            <TabPanel mt={2} width={"full"}>
              {tabState === 2 && unBondedNfMeIds?.length > 0 ? (
                <SimpleGrid
                  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                  spacingY={4}
                  mx={{ base: 0, "2xl": "24 !important" }}
                  mt="5 !important"
                  justifyItems={"center"}>
                  {unBondedNfMeIds.map((item, index) => (
                    <WalletUnBondedDataNfts key={index} index={index} solDataNft={item} onShowBondingSuccessModal={handleShowBondingSuccessModal} />
                  ))}
                </SimpleGrid>
              ) : (
                <Flex>
                  <NoDataHere />
                </Flex>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      <KeyActionSuccessCTAModel
        isOpen={isBondingSuccessCTAModalOpen}
        onClose={() => {
          onBondingCompleteCTAModalClose();
        }}
        congratsActionMsg="Setting up a Bond to prove your Itheum Liveliness!"
      />
    </>
  );
}
