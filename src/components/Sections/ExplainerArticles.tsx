import React from "react";
import { Box, Heading, Text, Link, Card, CardBody, Stack, Flex } from "@chakra-ui/react";
import explainerArticleBG from "assets/img/explainer-article-bg.jpeg";

const ExplainerArticles = ({ reduceGap }: { reduceGap?: boolean }) => {
  return (
    <Flex flexWrap="wrap" gap={reduceGap ? 2 : 5} backgroundColor="none" justifyContent="space-between">
      <ArticleCard
        imgTitle="NFMe ID + Liveliness Staking"
        title="NFMe ID + Liveliness Reputation Staking"
        link="https://docs.itheum.io/product-docs/product/liveliness-on-chain-reputation/liveliness-staking-guide"
      />

      <ArticleCard
        imgTitle="Setting Up Your Wallets"
        title="Simple step-by-step guide to setting up your wallets"
        link="https://docs.itheum.io/product-docs/guides/supported-wallets"
      />

      <ArticleCard
        imgTitle="How can I mint a Data NFT"
        title="Guide on how to bond $ITHEUM tokens and mint a Data NFT"
        link="https://docs.itheum.io/product-docs/product/data-dex/minting-a-data-nft"
      />

      <ArticleCard
        imgTitle="Store your Data NFT's Data"
        title="Options on where you can store your Data NFT's data"
        link="https://docs.itheum.io/product-docs/integrators/data-streams-guides/data-asset-storage-options"
      />

      <ArticleCard
        imgTitle="How to Purchase a Data NFT"
        title="Simple step-by-step guide to owning Data NFTs"
        link="https://docs.itheum.io/product-docs/product/data-nft-marketplace/purchasing-a-data-nft"
      />

      <ArticleCard
        imgTitle="How to List a Data NFT for Trading"
        title="Quick guide to listing your Data NFTs for trading"
        link="https://docs.itheum.io/product-docs/product/data-nft-marketplace/listing-a-data-nft"
      />

      <ArticleCard
        imgTitle="Bonding and Liveliness"
        title="What is the role of Creator Bonding and Liveliness"
        link="https://docs.itheum.io/product-docs/protocol/itheum-life-liveliness-and-reputation-signalling"
      />

      <ArticleCard
        imgTitle="Itheum BiTz XP System"
        title="Boost your engagement with the Itheum BiTz XP System"
        link="https://docs.itheum.io/product-docs/protocol/itheum-life-liveliness-and-reputation-signalling/less-than-bitz-greater-than-xp-system"
      />
    </Flex>
  );
};

function ArticleCard({ imgTitle, title, link }: { imgTitle: string; title: string; link: string }) {
  return (
    <Card variant="outline" backgroundColor="none" border="none" w={{ base: "265px", lg: "390px", xl: "290px", "2xl": "315px" }} margin="auto">
      <CardBody>
        <Box>
          <Link href={link} isExternal>
            <Box position="relative">
              <Box
                border="1px solid transparent"
                borderColor="#00C797"
                borderRadius="16px"
                backgroundImage={explainerArticleBG}
                backgroundSize="cover"
                backgroundRepeat="no-repeat"
                backgroundPosition="-8px"
                h={{ base: "140px", xl: "160px", "2xl": "160px" }}
                w={{ base: "235px", xl: "265px", "2xl": "290px" }}></Box>
              <Text position="absolute" top="20px" left="25px" fontSize={{ base: "1rem", xl: "1.15rem", "2xl": "1.15rem" }} width="128px" color="bgWhite">
                {imgTitle}
              </Text>
            </Box>
          </Link>
        </Box>
        <Stack mt="3" spacing="2">
          <Link fontSize="sm" href={link} isExternal textDecoration="none">
            <Heading size="md" fontFamily="Clash-Medium" noOfLines={2} minH="43px">
              {title}
            </Heading>
          </Link>
        </Stack>
      </CardBody>
    </Card>
  );
}

export default ExplainerArticles;
