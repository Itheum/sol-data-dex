import React from "react";
import { Box, Text, Flex, Heading, Stack } from "@chakra-ui/react";
import { getSentryProfile } from "libs/utils";

const dataDexVersion = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : "version number unknown";
const nonProdEnv = `${getSentryProfile()}`;

export default function () {
  return (
    <Stack spacing={5}>
      <Flex align="top" gap={10}>
        {
          <Box maxW="sm" p="10" m="auto" borderRadius="lg" w="90%" maxWidth="initial">
            <Heading size="lg" mb="10">
              App Settings
            </Heading>

            <Box>
              <Heading size="md" mb="3">
                General Settings
              </Heading>
              <Box fontSize="sm">
                <Text>App Version : {dataDexVersion}</Text>
                <Text>Sentry Profile : {nonProdEnv && <>{nonProdEnv}</>}</Text>
              </Box>
            </Box>

            <Box mt="10">
              <Heading size="md" mb="3">
                Env Vars
              </Heading>
              <Box fontSize="sm">
                <Text>VITE_ENV_NETWORK : {import.meta.env.VITE_ENV_NETWORK}</Text>
                <br />
                <Text>VITE_ENV_NFT_STORAGE_KEY : {maskOutputString(import.meta.env.VITE_ENV_NFT_STORAGE_KEY, 10, 10)}</Text>
                <br />
                <Text>VITE_ENV_BACKEND_API : {maskOutputString(import.meta.env.VITE_ENV_BACKEND_API, 10, 10)}</Text>
                <Text>VITE_ENV_DATADEX_DEVNET_API : {maskOutputString(import.meta.env.VITE_ENV_DATADEX_DEVNET_API, 26, 5)}</Text>
                <Text>VITE_ENV_DATAMARSHAL_DEVNET_API : {maskOutputString(import.meta.env.VITE_ENV_DATAMARSHAL_DEVNET_API, 26, 5)}</Text>
                <br />
                <Text>VITE_ENV_ITHEUM_SOL_TOKEN_ADDRESS : {import.meta.env.VITE_ENV_ITHEUM_SOL_TOKEN_ADDRESS}</Text>
                <Text>VITE_ENV_SOLANA_NETWORK_RPC : {maskOutputString(import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC, 10, 10)}</Text>
                <Text>VITE_ENV_BONDING_PROGRAM_ID : {import.meta.env.VITE_ENV_BONDING_PROGRAM_ID}</Text>
                <br />
                <Text>VITE_PRINT_UI_DEBUG_PANELS : {import.meta.env.VITE_PRINT_UI_DEBUG_PANELS}</Text>
              </Box>
            </Box>

            <Box mt="10">
              <Heading size="md" mb="3">
                Dynamic Settings
              </Heading>
              <Box fontSize="sm"></Box>
            </Box>
          </Box>
        }
      </Flex>
    </Stack>
  );
}

function maskOutputString(val: string | undefined, charsAtStart: number, charsAtEnd: number) {
  if (!val) {
    return "n/a";
  } else {
    return `${val?.substring(0, charsAtStart)} ********** ${val?.slice(-1 * charsAtEnd)}`;
  }
}
