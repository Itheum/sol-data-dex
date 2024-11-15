import React from "react";
import { Box, Button, Flex, Heading, SimpleGrid, Spacer, Stack, Text, useBreakpointValue, useColorMode } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import liveliness from "assets/img/nfme/liveliness.png";
import myNFMe from "assets/img/nfme/nfme-data-nft-token.png";
import illustration from "assets/img/whitelist/getWhitelist.png";
import NewCreatorCTA from "components/NewCreatorCTA";
import NFMeIdCTA from "components/NFMeIdCTA";
import NftMediaComponent from "../../components/NftMediaComponent";

export default function MyHome({ setMenuItem }: { setMenuItem: any }) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const tileBoxW = "310px";
  const heroGridMargin = useBreakpointValue({ base: "auto", md: "initial" });

  return (
    <>
      <Stack>
        <Box mx={{ base: 5, lg: 24 }}>
          <Box m={heroGridMargin} pt="20" pb="10" w={"100%"}>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3, "2xl": 4 }} spacing={10}>
              <Box w={[tileBoxW, "initial"]} border="1px solid transparent" borderColor="#00C79740" borderRadius="16px" m={{ base: "auto", md: "initial" }}>
                <Stack p="5" h={"439px"} borderRadius="lg" alignItems={{ base: "center", xl: "start" }}>
                  <Box
                    className="bounce-hero-img"
                    h="100%"
                    w="100%"
                    bgPosition="50% 30%"
                    bgImage={illustration}
                    bgSize="230px"
                    backgroundRepeat="no-repeat"></Box>
                  <Spacer />

                  <Flex w="full" justifyContent="center">
                    <Button
                      mt="3"
                      size="lg"
                      colorScheme="teal"
                      variant="outline"
                      borderRadius="xl"
                      onClick={() => {
                        navigate("/mintdata");
                      }}>
                      <Text color={colorMode === "dark" ? "white" : "black"}>Mint Your Data as a Data NFT</Text>
                    </Button>
                  </Flex>
                </Stack>
              </Box>

              <Box w={[tileBoxW, "initial"]} border="1px solid transparent" borderColor="#00C79740" borderRadius="16px" m={{ base: "auto", md: "initial" }}>
                <Stack p="5" h={"430px"} alignItems="center">
                  <Heading size="md" fontFamily="Clash-Medium" pb={2}>
                    NFMe ID
                  </Heading>
                  <Spacer />
                  <NftMediaComponent imageUrls={[myNFMe]} imageHeight="200px" imageWidth="200px" borderRadius="md" shouldDisplayArrows={false} />
                  <Spacer />

                  <Flex w="full" justifyContent="center">
                    <Button
                      mt="3"
                      size="lg"
                      colorScheme="teal"
                      borderRadius="xl"
                      onClick={() => {
                        navigate("/mintdata?launchTemplate=nfmeidvault");
                      }}>
                      <Text>Mint Your NFMe ID</Text>
                    </Button>
                  </Flex>
                </Stack>
              </Box>

              <Box w={[tileBoxW, "initial"]} border="1px solid transparent" borderColor="#00C79740" borderRadius="16px" m={{ base: "auto", md: "initial" }}>
                <Stack p="5" h={"430px"} alignItems="center">
                  <Heading size="md" fontFamily="Clash-Medium" pb={2}>
                    Liveliness Staking Rewards
                  </Heading>
                  <Box h="100%" w="100%" bgPosition="50% 30%" bgImage={liveliness} bgSize="400px" backgroundRepeat="no-repeat"></Box>
                  <Spacer />

                  <Flex w="full" justifyContent="center">
                    <Button
                      mt="3"
                      size="lg"
                      colorScheme="teal"
                      borderRadius="xl"
                      onClick={() => {
                        navigate("/liveliness");
                      }}>
                      <Text>Liveliness Staking</Text>
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            </SimpleGrid>
          </Box>
        </Box>

        <Box m="auto" pt="10" pb="10" w={"100%"} bgGradient={colorMode === "light" ? "bgWhite" : "linear(to-b, bgDark, #00C79730, bgDark)"}>
          <NFMeIdCTA />
        </Box>

        <Box m="auto" pt="10" pb="10" w={"100%"} bgGradient={colorMode === "light" ? "bgWhite" : "linear(to-b, bgDark, #6B46C160, bgDark)"}>
          <NewCreatorCTA />
        </Box>
      </Stack>
    </>
  );
}
