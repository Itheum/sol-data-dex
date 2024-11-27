import React from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Text, Flex, HStack, Link, Heading, useColorMode } from "@chakra-ui/react";
import { getSentryProfile } from "libs/utils";

const dataDexVersion = import.meta.env.VITE_APP_VERSION ?? "version number unknown";
const nonProdEnv = `env:${getSentryProfile()}`;

export default function () {
  const { colorMode } = useColorMode();

  return (
    <Flex
      paddingX={{ base: 5, md: 20, xl: 36 }}
      backgroundColor={colorMode === "light" ? "bgWhite" : "bgDark"}
      borderTop="solid .1rem"
      borderColor="teal.200"
      pb={10}
      pt={10}
      flexDirection={{ base: "column", md: "row" }}>
      <Flex flex="1" flexDir="column" alignItems="center" justifyContent="center" height="100%" mt={5} pr={5}>
        <Box>
          <Heading size={"lg"} fontFamily="Clash-Medium" color={"teal.200"}>
            Solana Data DEX
          </Heading>
          <Text fontSize="md" mt={3}>
            {" "}
            Mint free NFMe IDs and bond ITHEUM tokens to prove your web3 Liveliness, receive staking rewards on your Liveliness bonds, claim free Music Data
            NFTs and earn BiTz XP for your activity!
          </Text>
        </Box>

        <Flex flexDir="column" mt={30} w="100%">
          <HStack>
            <Link fontSize="sm" href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/terms-of-use" isExternal>
              Terms of Use <ExternalLinkIcon mx={1} />
            </Link>
            <Link fontSize="sm" href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/privacy-policy" isExternal>
              Privacy Policy <ExternalLinkIcon mx={1} />
            </Link>
            <Link fontSize="sm" href="https://stats.uptimerobot.com/D8JBwIo983" isExternal>
              Protocol Status <ExternalLinkIcon mx={1} />
            </Link>
          </HStack>
          <Text fontSize="sm" mt={3} opacity={".8"}>
            {dataDexVersion} {nonProdEnv && <>{nonProdEnv}</>}
          </Text>
        </Flex>
      </Flex>
      <Flex
        flexDir="row"
        flex="1"
        justifyContent="space-between"
        height="100%"
        mt={{ base: 10, md: 5 }}
        pl={{ base: 0, md: 5 }}
        borderLeft={{ base: "none", md: "solid .1rem" }}
        borderColor={{ base: "none", md: "teal.200" }}
        flexDirection={{ base: "column", md: "row" }}>
        <Box>
          <Heading size="md" fontFamily="Clash-Medium" color={"teal.200"}>
            Connect With Us
          </Heading>
          <Box mt={3}>
            <ul className="text-xs md:text-sm flex flex-col gap-1">
              <li>
                {"> "}
                <a href="https://x.com/itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  X
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://itheum.io/discord" target="_blank" className="hover:underline" rel="noreferrer">
                  Discord
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://t.me/itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  Telegram
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://www.instagram.com/itheumofficial/" target="_blank" className="hover:underline" rel="noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://drip.haus/itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  DRiP Haus
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://itheum.medium.com" target="_blank" className="hover:underline" rel="noreferrer">
                  Medium Blog
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://www.youtube.com/itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  YouTube
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://github.com/Itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  Github
                </a>
              </li>
              <li>
                {"> "}
                <a href="itheum.io" target="_blank" className="hover:underline" rel="noreferrer">
                  Website
                </a>
              </li>
            </ul>
          </Box>
        </Box>

        <Box mt={{ base: 10, md: 0 }}>
          <Heading size="md" fontFamily="Clash-Medium" color={"teal.200"}>
            More to Explore
          </Heading>
          <Box mt={3}>
            <ul className="text-xs md:text-sm flex flex-col gap-1">
              <li>
                {"> "}
                <a href="https://datadex.itheum.com" target="_blank" className="hover:underline" rel="noreferrer">
                  MultiversX Data DEX
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://portal.itheum.com" target="_blank" className="hover:underline" rel="noreferrer">
                  {`Solana <> MultiversX `}Token Bridge
                </a>
              </li>
              <li>
                {"> "}
                <a href="/NFMeID" className="hover:underline" rel="noreferrer">
                  Claim your NFMe ID
                </a>
              </li>
              <li>
                {"> "}
                <a href="/liveliness" className="hover:underline" rel="noreferrer">
                  Liveliness Staking
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://portal.itheum.com/nftunes" target="_blank" className="hover:underline" rel="noreferrer">
                  NF-Tunes : Stream Web3 Music
                </a>
              </li>
              <li>
                {"> "}
                <a href="https://drip.haus/itheum" target="_blank" className="hover:underline" rel="noreferrer">
                  Free Music Data NFTs on {`Solana's`} DRiP Haus
                </a>
              </li>
            </ul>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
