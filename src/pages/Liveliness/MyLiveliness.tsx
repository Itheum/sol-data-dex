import React, { useEffect } from "react";
import { Flex, Heading, Stack, Box, Button, Link, Text, useColorMode } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaTachometerAlt, FaUserAstronaut } from "react-icons/fa";
import { Link as ReactRouterLink } from "react-router-dom";
import { LivelinessStakingSol } from "components/Liveliness/LivelinessStakingSol";

export default function MyLiveliness() {
  const { connected } = useWallet();
  const { colorMode } = useColorMode();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <>
      <Stack>
        <Flex flexDirection={{ base: "column", lg: "row" }} alignItems={{ base: "start", lg: "end" }}>
          <Box>
            <Heading size="xl" fontFamily="Clash-Medium" mt={10} mx={{ base: 10, lg: 24 }} textAlign={{ base: "center", lg: "start" }}>
              My Liveliness Reputation
            </Heading>
            <Heading
              size="1rem"
              opacity=".7"
              fontFamily="Satoshi-Medium"
              fontWeight="light"
              px={{ base: 10, lg: 24 }}
              textAlign={{ base: "center", lg: "start" }}>
              Bond $ITHEUM tokens into your NFMe ID to prove your on-chain reputation and receive protocol staking rewards in return.
            </Heading>
          </Box>

          <Box w={{ base: "100%", lg: "450px" }} mt={{ base: 5, lg: 0 }}>
            <Flex flexDirection={{ base: "row", lg: "row" }} justifyContent={{ base: "center", lg: "start" }} gap="15px">
              <Link as={ReactRouterLink} to={"/NFMeID"} mx={"2px"}>
                <Button borderColor="teal.200" fontSize="md" variant="outline" size={"md"} w="120px" h="100px">
                  <Flex flexDirection="column" justifyContent="center" alignItems="center" px={{ base: 0, "2xl": 1.5 }} color="teal.200" pointerEvents="none">
                    <FaUserAstronaut size={"2em"} />
                    <Text pl={2} color={colorMode === "dark" ? "white" : "black"} mt="2">
                      NFMe ID : <br /> Learn and Mint
                    </Text>
                  </Flex>
                </Button>
              </Link>
              <Link as={ReactRouterLink} to={"/NFMeID?view=staking"} mx={"2px"}>
                <Button borderColor="teal.200" fontSize="md" variant="outline" size={"md"} w="120px" h="100px">
                  <Flex flexDirection="column" justifyContent="center" alignItems="center" px={{ base: 0, "2xl": 1.5 }} color="teal.200" pointerEvents="none">
                    <FaTachometerAlt size={"2.2em"} />
                    <Text pl={2} color={colorMode === "dark" ? "white" : "black"} mt="1">
                      Liveliness : <br /> What is it?
                    </Text>
                  </Flex>
                </Button>
              </Link>
            </Flex>
          </Box>
        </Flex>

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
