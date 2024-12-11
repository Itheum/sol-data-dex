import React from "react";
import { Button, Text, Image, useColorMode, Flex, Box } from "@chakra-ui/react";
import darkNFMeOnly from "assets/img/nfme/nfme-only-dark.png";
import liteNFMeOnly from "assets/img/nfme/nfme-only-lite.png";
import darkNFMeWithBond from "assets/img/nfme/nfme-with-bond-dark.png";
import liteNFMeWithBond from "assets/img/nfme/nfme-with-bond-lite.png";
import { useMintStore } from "store/mint";

interface NFMeIDMintOptionsProps {
  onFreeMint: () => void;
  onMintAndBond: () => void;
}

export const NFMeIDMintOptions = ({ onFreeMint, onMintAndBond }: NFMeIDMintOptionsProps) => {
  const { colorMode } = useColorMode();
  const { freeNfMeIdClaimed } = useMintStore();

  return (
    <Flex
      width="100%"
      flexDir={{ base: "column", md: "row" }}
      height={{ base: "auto", md: "250px" }}
      justifyContent="space-between"
      alignItems={{ base: "center", md: "end" }}
      gap={{ base: "4", md: "2" }}>
      {!freeNfMeIdClaimed && (
        <Box flex={1} textAlign="center">
          <Button borderColor="teal.200" fontSize="md" variant="outline" size={"md"} w="250px" h="260px" onClick={onFreeMint}>
            <Flex flexDirection="column" alignItems="center" justifyContent={"space-between"} px={{ base: 0, "2xl": 1.5 }} color="teal.200" height="90%">
              <Image
                src={colorMode === "light" ? liteNFMeOnly : darkNFMeOnly}
                alt="Mint Free NFMe ID with Bond + Staking Rewards LATER"
                rounded="lg"
                w="172px"
              />
              <Box mt="2">
                <Text color={colorMode === "dark" ? "white" : "black"} fontWeight="bold" fontSize="xl">
                  Mint Free NFMe ID:
                </Text>
                <Text mt="1" color={colorMode === "dark" ? "white" : "black"}>
                  Bond + Staking Rewards LATER
                </Text>
              </Box>
            </Flex>
          </Button>
        </Box>
      )}

      <Box flex={1} textAlign="center">
        <Button borderColor="teal.200" fontSize="md" variant="outline" size={"md"} w="250px" h="260px" onClick={onMintAndBond}>
          <Flex flexDirection="column" alignItems="center" justifyContent={"space-between"} px={{ base: 0, "2xl": 1.5 }} color="teal.200" height="90%">
            <Image
              src={colorMode === "light" ? liteNFMeWithBond : darkNFMeWithBond}
              alt="Mint Free NFMe ID with Bond + Staking Rewards LATER"
              rounded="lg"
              w="180px"
            />
            <Box mt="2">
              <Text color={colorMode === "dark" ? "white" : "black"} fontWeight="bold" fontSize="xl">
                Mint NFMe ID:
              </Text>
              <Text mt="1" color={colorMode === "dark" ? "white" : "black"}>
                with Bond + Staking Rewards NOW
              </Text>
            </Box>
          </Flex>
        </Button>
      </Box>
    </Flex>
  );
};
