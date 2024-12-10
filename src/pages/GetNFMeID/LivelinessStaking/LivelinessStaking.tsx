import React from "react";
import { Box, Button, Flex, Image, Text, Heading, Link, useColorMode } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import darkLivelinessRewards from "assets/img/landing/nfme/dark-liveliness-rewards.png";
import darkMintWithBond from "assets/img/landing/nfme/dark-mint-nfmeid-with-bond.png";
import darkTopUp from "assets/img/landing/nfme/dark-nfmeid-topup.png";
import liteLivelinessRewards from "assets/img/landing/nfme/lite-liveliness-rewards.png";
import liteMintWithBond from "assets/img/landing/nfme/lite-mint-nfmeid-with-bond.png";
import liteTopUp from "assets/img/landing/nfme/lite-nfmeid-topup.png";
import { gtagGo } from "libs/utils";

export const LivelinessStaking = ({ onShowConnectWalletModal }: { onShowConnectWalletModal?: any }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  return (
    <Box mb="10" width={{ base: "95%", md: "80%" }} textAlign={{ base: "center", md: "center" }} m="auto" pt="5">
      <Flex id="liveliness" flexDirection="column" my={10} p={2}>
        <Heading as="h1" textAlign="center" fontSize={{ base: "34px", md: "50px" }} fontFamily="Clash-Medium">
          Liveliness Staking Rewards
        </Heading>
        <Heading as="h2" textAlign="center" fontSize={{ base: "20px", md: "20px" }} mb={5} fontFamily="Clash-Medium">
          How can you get your Liveliness Staking rewards? Easy as 1,2,3...
        </Heading>

        <Flex flexDirection="column">
          <Flex flexDirection={{ base: "column", md: "row" }} my="5" alignItems="center">
            <Box minW={{ base: "330px", md: "500px" }}>
              <Image
                boxSize="370px"
                height="auto"
                m="auto"
                border="1px solid"
                borderColor="teal.400"
                src={colorMode === "light" ? liteMintWithBond : darkMintWithBond}
                alt="Step 1: bond $ITHEUM to create your NFMe ID"
                borderRadius="lg"
              />
            </Box>
            <Text p="5" fontSize="lg" textAlign={{ base: "center", md: "left" }} fontFamily="Clash-Regular">
              Bond a minimum amount of $ITHEUM to mint your NFMe ID and activate your Liveliness score—your on-chain reputation as a Data Creator.
              <br />
              <br />
              Your bond earns staking rewards based on its size and your Liveliness score. Keep your bond near 100% to maximize rewards and renew it anytime.
            </Text>
          </Flex>
          <Flex flexDirection={{ base: "column-reverse", md: "row" }} my="5" alignItems="center">
            <Text p="5" fontSize="lg" textAlign={{ base: "center", md: "right" }} fontFamily="Clash-Regular">
              You can mint unlimited NFMe IDs, each with a bond attached. The more you mint and bond, the greater your staking rewards.
              <br />
              <br />
              Set one NFMe ID as your {`"Vault"`} to top up its bond with additional $ITHEUM, boosting your Liveliness reputation and increasing your staking
              rewards.
            </Text>
            <Box minW={{ base: "400px", md: "500px" }}>
              <Image
                boxSize="75%"
                height="auto"
                m="auto"
                border="1px solid"
                borderColor="teal.400"
                src={colorMode === "light" ? liteTopUp : darkTopUp}
                alt="Step 2: Top-up Liveliness into your NFMe ID"
                borderRadius="lg"
              />
            </Box>
          </Flex>
          <Flex flexDirection={{ base: "column", md: "row" }} my="5" alignItems="center">
            <Box minW={{ base: "400px", md: "500px" }}>
              <Image
                boxSize="70%"
                height="auto"
                m="auto"
                border="1px solid"
                borderColor="teal.400"
                src={colorMode === "light" ? liteLivelinessRewards : darkLivelinessRewards}
                alt="Step 3: Get Staking Rewards for your Liveliness"
                borderRadius="lg"
              />
            </Box>
            <Text p="5" fontSize="lg" textAlign={{ base: "center", md: "left" }} fontFamily="Clash-Regular">
              Lock more $ITHEUM bonds and maintain high {`"Vault Liveliness"`} across your Data NFTs or NFMe IDs to boost your rewards.
              <br />
              <br />
              Claim rewards anytime or reinvest them into your NFMe ID. Keep your Vault Liveliness above 95% for maximum earnings.
            </Text>
          </Flex>
        </Flex>

        <Box m="auto">
          <Button
            size="xl"
            variant="solid"
            colorScheme="teal"
            px={7}
            py={6}
            rounded="lg"
            mt={7}
            onClick={() => {
              gtagGo("nfm", "try", "stake");

              navigate("/liveliness");
            }}>
            Get Liveliness Staking Rewards Now!
          </Button>
        </Box>
        <Box m="auto" mt="5">
          <Button
            as={Link}
            m="auto"
            colorScheme="teal"
            variant="outline"
            px={7}
            py={6}
            rounded="lg"
            onClick={() => {
              gtagGo("nfm", "guide", "stake");
            }}
            href="https://docs.itheum.io/product-docs/integrators/data-dex-guides/liveliness-staking-guide-solana"
            isExternal>
            Read & Follow a Guide
          </Button>
        </Box>
      </Flex>
    </Box>
  );
};
