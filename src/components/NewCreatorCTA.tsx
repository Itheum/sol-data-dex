import React from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Flex, Image, Link, Heading, Button, Text } from "@chakra-ui/react";
import dataNFTImg from "assets/img/whitelist/getWhitelist.png";

const NewCreatorCTA = () => {
  return (
    <Flex flexDirection={{ base: "column-reverse", md: "row" }} alignItems="center" justifyContent="center">
      <Box>
        <Image className="bounce-hero-img" margin="auto" boxSize="auto" w={{ base: "90%", md: "60%" }} src={dataNFTImg} alt="Data NFTs Illustration" />
      </Box>

      <Box width={["100%", null, null, "500px", "650px"]} textAlign={["center", null, null, "left", "left"]}>
        <Heading as="h1" size="xl" fontFamily="Clash-Medium" mb={2}>
          Are you a{" "}
          <Text as="span" color="teal.200">
            Music / AI Creator?{" "}
          </Text>
        </Heading>

        <Text
          fontSize="xl"
          fontFamily="Satoshi-Medium"
          fontWeight="400"
          lineHeight="25px"
          width={{ base: "90%", md: "100%" }}
          m={{ base: "auto", md: "initial" }}>
          Itheum puts you in control of your data and is shaking up the Music + AI industry as our first focus! Musicians are already using our platform to
          launch on-chain EPs and connect with fans through
          <Link ml={2} href="https://explorer.itheum.io/nftunes" isExternal>
            NF-Tunes <ExternalLinkIcon mx="2px" />
          </Link>
          <a href="" target="_blank"></a> — the ultimate Web3 music app for musicians, fans, and collectors.
          <br />
          <br />
          Ready to start your Data NFT journey but feeling unsure? {`Don’t worry—we’ve`} got your back with the full {`"VIP treatment."`}
          <br />
          <br />
          So, what are you waiting for? Let’s make magic happen! 🚀🎶
        </Text>

        <Button as={Link} variant="solid" colorScheme="teal" px={7} py={6} rounded="lg" mt={7} href="https://itheum.io/discord" isExternal>
          Join Discord and Chat
        </Button>
        <Button
          as={Link}
          variant="outline"
          colorScheme="teal"
          px={7}
          py={6}
          rounded="lg"
          mt={7}
          ml={5}
          href="https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform"
          isExternal>
          Or fill this form and {`we'll`} reach out
        </Button>
      </Box>
    </Flex>
  );
};

export default NewCreatorCTA;
