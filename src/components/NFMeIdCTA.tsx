import React from "react";
import { Box, Flex, Image, Link, Heading, Button, Text } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import nfMeIDVault from "assets/img/nfme/nfme-id-avatar.png";

const NFMeIdCTA = () => {
  const navigate = useNavigate();
  const { connected: isSolWalletConnected } = useWallet();

  return (
    <Flex mt={{ base: "10", md: "0" }} flexDirection={["column", null, "row"]} alignItems="center" justifyContent="center">
      <Box width={["100%", null, null, "300px", "550px"]} textAlign={["center", null, null, "left", "left"]}>
        <Heading as="h1" size="xl" fontFamily="Clash-Medium" width={{ base: "80%", md: "90%" }} m={{ base: "auto", md: "initial" }}>
          Mint your{" "}
          <Text as="span" color="teal.200">
            NFMe ID{" "}
          </Text>{" "}
          , stake your{" "}
          <Text as="span" color="teal.200">
            Liveliness Reputation
          </Text>{" "}
          and{" "}
          <Text as="span" color="teal.200">
            Farm Token Rewards.
          </Text>
        </Heading>

        <Button
          as={Link}
          variant="solid"
          colorScheme="teal"
          px={7}
          py={6}
          rounded="lg"
          mt={7}
          onClick={() => {
            navigate("/NFMeID");
          }}>
          Mint Your NFMe ID
        </Button>

        <Button
          as={Link}
          variant="outline"
          colorScheme="teal"
          px={7}
          py={6}
          rounded="lg"
          mt={7}
          ml={{ base: "0", md: "5" }}
          onClick={() => {
            if (isSolWalletConnected) {
              navigate("/liveliness");
            } else {
              navigate("/NFMeID?view=staking");
            }
          }}>
          Get Liveliness Staking Rewards
        </Button>
      </Box>

      <Box mt={{ base: "10", md: "0" }}>
        <Image margin="auto" boxSize="auto" w={{ base: "60%", md: "50%" }} src={nfMeIDVault} alt="Data NFTs Illustration" />
      </Box>
    </Flex>
  );
};

export default NFMeIdCTA;
