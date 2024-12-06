import React, { useEffect } from "react";
import { Flex, Heading, Stack, Box } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LivelinessStakingSol } from "components/Liveliness/LivelinessStakingSol";

export default function MyLiveliness() {
  const { connected } = useWallet();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <>
      <Stack>
        <Heading size="xl" fontFamily="Clash-Medium" mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          My Liveliness Reputation
        </Heading>
        <Heading size="1rem" opacity=".7" fontFamily="Satoshi-Medium" fontWeight="light" px={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
          Bond $ITHEUM tokens into your NFMe ID to prove your on-chain reputation and receive protocol staking rewards in return.
        </Heading>

        <Box mt={10} mx={{ base: 2, lg: 10 }}>
          <Flex flexDirection={{ base: "column" }} alignItems="start">
            {connected && (
              <>
                <LivelinessStakingSol />
              </>
            )}
          </Flex>
        </Box>
      </Stack>
    </>
  );
}
