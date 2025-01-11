import React, { useCallback, useMemo } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { MdOutlineInfo } from "react-icons/md";
import NftMediaComponent from "components/NftMediaComponent";
import ExploreAppButton from "components/UtilComps/ExploreAppButton";
import ShortAddress from "components/UtilComps/ShortAddress";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { SOLSCAN_EXPLORER_URL } from "libs/Solana/config";
import { transformDescription, replacePublicIPFSImgWithGatewayLink } from "libs/utils";

interface NormalDataNftProps {
  index: number;
  solDataNft: DasApiAsset;
}

const NormalDataNft: React.FC<NormalDataNftProps> = ({ index, solDataNft }) => {
  const { networkConfiguration } = useNetworkConfiguration();

  // Memoize the openNftDetailsDrawer callback
  const handleNftDetailsOpen = useCallback(() => {
    window.open(replacePublicIPFSImgWithGatewayLink(solDataNft.content.json_uri), "_blank");
  }, [solDataNft.content.json_uri]);

  // Memoize the autoSlideInterval calculation
  const autoSlideInterval = useMemo(() => {
    return Math.floor(Math.random() * 6000 + 6000);
  }, []); // Empty dependency array as we want this to be constant per instance

  // Memoize the NftMediaComponent
  const nftMedia = useMemo(
    () => (
      <NftMediaComponent
        printIdForDebug={index.toString()}
        getImgsFromNftMetadataContent={solDataNft.content}
        autoSlide
        imageHeight="236px"
        imageWidth="236px"
        autoSlideInterval={autoSlideInterval}
        onLoad={() => {}}
        openNftDetailsDrawer={handleNftDetailsOpen}
        marginTop="1.5rem"
        borderRadius="16px"
      />
    ),
    [index, solDataNft.content, autoSlideInterval, handleNftDetailsOpen]
  );

  return (
    <Skeleton fitContent={true} isLoaded={true} borderRadius="16px" display="flex" alignItems="center" justifyContent="center">
      <Box
        key={index}
        w="275px"
        h="550px"
        mx="3 !important"
        border="1px solid transparent"
        borderColor="#00C79740"
        borderRadius="16px"
        mb="1rem"
        position="relative"
        pb="1rem">
        {nftMedia}
        <Flex mx={6} direction="column">
          <Text fontWeight="semibold" fontSize="lg" mt="1.5" noOfLines={1}>
            {solDataNft.content.metadata.name}
          </Text>
          <Link
            onClick={() => window.open(`${SOLSCAN_EXPLORER_URL}token/${solDataNft.id}?cluster=${networkConfiguration}`, "_blank")}
            fontSize="md"
            color="#929497">
            <ShortAddress address={solDataNft.id} fontSize="lg" tooltipLabel="Check Data Nft on explorer" /> <ExternalLinkIcon ml={1} mt={-2} />
          </Link>{" "}
          <Box>
            <Popover trigger="hover" placement="auto">
              <PopoverTrigger>
                <Flex flexGrow="1" mt={4}>
                  <Text fontSize="md" color="#929497" noOfLines={2} w="100%" h="10">
                    {solDataNft.content.metadata.description && transformDescription(solDataNft.content.metadata.description)}
                  </Text>
                </Flex>
              </PopoverTrigger>
              <PopoverContent mx="2" width="220px" mt="-7">
                <PopoverHeader fontWeight="semibold" fontSize="lg">
                  Description
                </PopoverHeader>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                  <Text fontSize="md" mt="1" color="#929497">
                    {solDataNft.content.metadata.description ? transformDescription(solDataNft.content.metadata.description) : "No description available"}
                  </Text>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
          <ExploreAppButton tokenName={solDataNft.content.metadata.name} customLabel="Listen on NF-Tunes" />
          {solDataNft.creators && (
            <Box mt={3} color="#8c8f92d0" fontSize="sm" display="flex" alignItems="start">
              Creator{solDataNft.creators.length > 1 && "s"}:&nbsp;{" "}
              <Flex w={"full"} alignItems="center" key={index} flexDirection={"column"} maxH="100px" overflowY="auto" scrollBehavior={"auto"}>
                {solDataNft.creators.map((creator, index) => (
                  <Link
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    key={index}
                    isExternal
                    href={`${SOLSCAN_EXPLORER_URL}account/${creator.address}?cluster=${networkConfiguration}`}>
                    <ShortAddress address={creator.address} fontSize="sm" tooltipLabel="Check on explorer" />{" "}
                    <MdOutlineInfo style={{ marginLeft: "5px", color: "#00c797" }} fontSize="lg" />
                  </Link>
                ))}
              </Flex>
            </Box>
          )}
        </Flex>
      </Box>
    </Skeleton>
  );
};

export default NormalDataNft;
