import React, { useState, useEffect } from "react";
import { Box, Button, Heading, Image, Stack, Text, useColorMode, Wrap } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import NewCreatorCTA from "components/NewCreatorCTA";
import { nfMeIDVaultConfig } from "libs/config";
import { sleep } from "libs/utils";
import { qsParams } from "libs/utils/util";
import { useMintStore } from "store";
import ProgramCard from "./components/ProgramCard";
import { TradeFormModal } from "./components/TradeFormModal";

export const TradeData: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const { colorMode } = useColorMode();
  const lockPeriod = useMintStore((state) => state.lockPeriodForBond);
  const { connected: solConnected } = useWallet();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    async function launchAutoTemplate() {
      // lockPeriod is a dependency in TradeForm, so we need to make sure it loads before open the form
      if (!lockPeriod || lockPeriod?.length === 0) {
        return;
      }

      const queryParams = qsParams();
      const launchTemplate = queryParams?.launchTemplate;

      if (launchTemplate) {
        if (launchTemplate === "nfmeidvault") {
          await sleep(0.5);
          setIsDrawerOpen(true);
          setPrefilledData(nfMeIDVaultConfig);
        }
      }
    }

    launchAutoTemplate();
  }, [lockPeriod, solConnected]);

  return (
    <Box>
      <Stack mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
        <Heading size="xl" fontFamily="Clash-Medium">
          Mint Data NFTs
        </Heading>
        <Heading size="1rem" opacity=".7" fontFamily="Satoshi-Medium" fontWeight="light">
          Mint your Data Streams or Data Assets as Data NFTs and list and trade them as regular NFTs on any NFT Marketplace.
        </Heading>
        <Wrap shouldWrapChildren={true} spacing={5} display={"flex"} flexDir={"row"} justifyContent={{ base: "center", md: "start" }} overflow={"unset"}>
          <Box hidden={solConnected} maxW="xs" overflow="hidden" mt={5} border=".01rem solid transparent" borderColor="#00C79740" borderRadius="0.75rem">
            <Image src="https://itheum-static.s3.ap-southeast-2.amazonaws.com/data-stream.png" alt="" rounded="lg" />

            <Box p="6">
              <Box display="flex" alignItems="baseline">
                <Box mt="1" fontWeight="semibold" as="h4" lineHeight="tight" noOfLines={1}>
                  Any Data Stream as a Data NFT-FT
                </Box>
              </Box>
              <Button
                mt="3"
                colorScheme="teal"
                variant="outline"
                borderRadius="xl"
                onClick={() => {
                  setIsDrawerOpen(!isDrawerOpen);
                  setPrefilledData(null);
                }}>
                <Text color={colorMode === "dark" ? "white" : "black"}>Mint Data NFT</Text>
              </Button>
            </Box>
          </Box>

          <ProgramCard
            key={nfMeIDVaultConfig.program}
            item={nfMeIDVaultConfig}
            setIsDrawerOpen={setIsDrawerOpen}
            setPrefilledData={setPrefilledData}
            isDrawerOpen={isDrawerOpen}
            isNew={true}
          />
        </Wrap>
      </Stack>
      <Box marginTop={10} bgGradient={colorMode === "light" ? "bgWhite" : "linear(to-b, bgDark, #6B46C160, bgDark)"}>
        <NewCreatorCTA />
      </Box>
      <TradeFormModal isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} dataToPrefill={prefilledData} />
    </Box>
  );
};
