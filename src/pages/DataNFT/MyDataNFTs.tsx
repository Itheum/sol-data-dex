import React, { useEffect } from "react";
import { Icon } from "@chakra-ui/icons";
import { Flex, Heading, SimpleGrid, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useColorMode } from "@chakra-ui/react";
import { FaBrush } from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { NoDataHere } from "components/Sections/NoDataHere";
import WalletDataNftSol from "components/SolanaNfts/WalletDataNftSol";
import useThrottle from "components/UtilComps/UseThrottle";
import { useNftsStore } from "store/nfts";

export default function MyDataNFTs({ tabState }: { tabState: number }) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const { solNfts } = useNftsStore();

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
  }, []);

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
                    <WalletDataNftSol key={index} index={index} solDataNft={item} />
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
    </>
  );
}
