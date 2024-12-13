import React, { useState, useEffect } from "react";
import { Button, Text, Image, useColorMode, Flex, Box } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import darkNFMeOnly from "assets/img/nfme/nfme-only-dark.png";
import liteNFMeOnly from "assets/img/nfme/nfme-only-lite.png";
import darkNFMeWithBond from "assets/img/nfme/nfme-with-bond-dark.png";
import liteNFMeWithBond from "assets/img/nfme/nfme-with-bond-lite.png";
import { checkIfFreeDataNftGiftMinted } from "libs/Solana/utils";
import { useMintStore } from "store/mint";

interface NFMeIDMintOptionsProps {
  onFreeMint: () => void;
  onMintAndBond: () => void;
  skipFreeMintCheck?: boolean;
}

export const NFMeIDMintOptions = ({ onFreeMint, onMintAndBond, skipFreeMintCheck }: NFMeIDMintOptionsProps) => {
  const { colorMode } = useColorMode();
  const { freeNfMeIdClaimed, updateFreeNfMeIdClaimed } = useMintStore();
  const { publicKey: userPublicKey } = useWallet();
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkFreeClaims = async () => {
      if (userPublicKey) {
        setFreeDropCheckLoading(true);
        const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", userPublicKey.toBase58());

        if (freeNfMeIdMinted.alreadyGifted) {
          updateFreeNfMeIdClaimed(true);
        }

        setFreeDropCheckLoading(false);
      }
    };

    // a logged in user might directly come to the NFMeID landing page (not via the dashboard), if so, and we need to make sure we check freeNfMeIdClaimed again to avoid showing them the button
    if (!freeNfMeIdClaimed && !skipFreeMintCheck) {
      checkFreeClaims();
    }
  }, [userPublicKey, freeNfMeIdClaimed, skipFreeMintCheck]);

  return (
    <Flex
      width="100%"
      flexDir={{ base: "column", md: "row" }}
      height={{ base: "auto", md: "250px" }}
      justifyContent="space-between"
      alignItems={{ base: "center", md: "end" }}
      gap={{ base: "4", md: "2" }}>
      {!freeNfMeIdClaimed && !freeDropCheckLoading && (
        <Box flex={1} textAlign="center" border="1px solid" rounded="lg" borderColor="teal.200" w="320px" h="260px">
          <Flex flexDirection="column" alignItems="center" justifyContent={"space-between"} px={{ base: 0, "2xl": 1.5 }} pb="2">
            <Image
              src={colorMode === "light" ? liteNFMeOnly : darkNFMeOnly}
              alt="Mint Free NFMe ID with Bond + Staking Rewards LATER"
              rounded="lg"
              w="172px"
              my="2"
              mb="2.5"
            />
            <Button colorScheme="teal" size="lg" onClick={onFreeMint} padding="20px !important">
              <Box>
                <Text fontWeight="bold" fontSize="xl">
                  Mint Free NFMe ID:
                </Text>
                <Text mt=".5">Bond + Staking Rewards LATER</Text>
              </Box>
            </Button>
          </Flex>
        </Box>
      )}

      <Box flex={1} textAlign="center" border="1px solid" rounded="lg" borderColor="teal.200" w="320px" h="260px">
        <Flex flexDirection="column" alignItems="center" justifyContent={"space-between"} px={{ base: 0, "2xl": 1.5 }} pb="2">
          <Image
            src={colorMode === "light" ? liteNFMeWithBond : darkNFMeWithBond}
            alt="Mint Free NFMe ID with Bond + Staking Rewards LATER"
            rounded="lg"
            w="180px"
            my="2"
          />
          <Button colorScheme="teal" size="lg" onClick={onMintAndBond} padding="20px !important">
            <Box>
              <Text fontWeight="bold" fontSize="xl">
                Mint NFMe ID:
              </Text>
              <Text mt=".5">with Bond + Staking Rewards NOW</Text>
            </Box>
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};
