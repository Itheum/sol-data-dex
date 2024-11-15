import React from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Text, Flex, HStack, Link, useColorMode } from "@chakra-ui/react";
import { getSentryProfile } from "libs/utils";

const dataDexVersion = import.meta.env.VITE_APP_VERSION ?? "version number unknown";
const nonProdEnv = `env:${getSentryProfile()}`;

export default function () {
  const { colorMode } = useColorMode();

  return (
    <Box
      backgroundColor={colorMode === "light" ? "bgWhite" : "bgDark"}
      height="5rem"
      borderTop="solid .1rem"
      borderColor="teal.200"
      flexGrow={{ base: 0, lg: 0 }}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <Text fontSize="xx-small">
          {dataDexVersion} {nonProdEnv && <>{nonProdEnv}</>}
        </Text>
        <HStack>
          <Link fontSize="xs" href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/terms-of-use" isExternal>
            Terms of Use <ExternalLinkIcon mx={1} />
          </Link>
          <Link fontSize="xs" href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/privacy-policy" isExternal>
            Privacy Policy <ExternalLinkIcon mx={1} />
          </Link>
          <Link fontSize="xs" href="https://stats.uptimerobot.com/D8JBwIo983" isExternal>
            Status <ExternalLinkIcon mx={1} />
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}
