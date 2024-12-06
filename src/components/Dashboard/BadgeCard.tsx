import React, { useState } from "react";
import { Box, HStack, Circle, Text, Flex, Wrap, WrapItem, keyframes, useDisclosure, useColorMode } from "@chakra-ui/react";
import { Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { claimBadge } from "libs/Solana/utils";
import { Badge } from "./BadgesPreview";
import { ClaimBadgeModal } from "./ClaimBadgeModal";

interface BadgeGroupProps {
  badgeCategoryMapWithCatNameAsKey: { [key: string]: { icon: string; shortName: string; gradient: string[]; description: string } };
  category: string;
  badges: Badge[];
}

const pulseKeyframe = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.5;
    box-shadow: 0 0 0 0 rgba(3, 199, 151, 0.4);
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
    box-shadow: 0 0 0 10px rgba(3, 199, 151, 0);
  }
  100% {
    transform: scale(1.2);
    opacity: 0.8;
    box-shadow: 0 0 0 0 rgba(3, 199, 151, 0);
  }
`;

const pulse = `${pulseKeyframe} 2s infinite`;

export const BadgeCard: React.FC<BadgeGroupProps> = ({ badgeCategoryMapWithCatNameAsKey, category, badges }) => {
  const { publicKey: userPublicKey } = useWallet();
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBadge, setSelectedBadge] = useState<Badge | undefined>(undefined);

  const categoryStyle = badgeCategoryMapWithCatNameAsKey[category] || {
    icon: "🏆",
    shortName: category,
    gradient: ["blue.400", "teal.400"],
  };

  // Add this helper to generate placeholder badges
  const getPlaceholderBadges = () => {
    // Show 3 placeholder badges when no badges exist
    return Array(3).fill({
      badge: "Future Badge",
      claimedOn: -1, // Use -1 to indicate placeholder/locked state
      issuedOn: 0,
      category: category,
      typeIdCatIdLeafId: "",
    });
  };

  const displayBadges = badges.length > 0 ? badges : getPlaceholderBadges();

  const handleClaimBadge = async () => {
    if (!selectedBadge) {
      return { success: false };
    }

    const resp = await claimBadge(userPublicKey?.toBase58(), selectedBadge.typeIdCatIdLeafId);

    if (resp.success) {
      return { success: true };
    } else {
      return { success: false, message: resp.message || "Failed to claim badge" };
    }
  };

  return (
    <>
      <Popover trigger="hover" placement="top">
        <PopoverContent bg={colorMode === "dark" ? "black" : "white"} maxW="250px">
          <PopoverArrow bg={colorMode === "dark" ? "white" : "black"} />
          <PopoverBody>{badgeCategoryMapWithCatNameAsKey[category]?.description}</PopoverBody>
        </PopoverContent>

        <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm">
          <HStack spacing={4} mb={4} justify="space-between">
            <HStack spacing={4} w="100%">
              <PopoverTrigger>
                <Circle
                  cursor="pointer"
                  size="50px"
                  bgGradient={`linear(135deg, ${categoryStyle.gradient[0]}, ${categoryStyle.gradient[1]})`}
                  color="white"
                  fontSize="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid transparent"
                  boxShadow="md">
                  {categoryStyle.icon}
                </Circle>
              </PopoverTrigger>
              <Flex direction="column" align="center" w="100%">
                <Text fontSize="xl" fontWeight="bold">
                  {categoryStyle.shortName}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {category}
                </Text>
              </Flex>
            </HStack>
          </HStack>

          <Wrap spacing={4} pl={16} align="center">
            {displayBadges.map((badge, index) => (
              <WrapItem key={index} mb={2}>
                <Box
                  position="relative"
                  _hover={{
                    "& > .badge-name": {
                      opacity: 1,
                      visibility: "visible",
                    },
                  }}>
                  <Box position="relative">
                    <Circle
                      size="30px"
                      bgGradient={`linear(135deg, ${categoryStyle.gradient[1]}, ${categoryStyle.gradient[0]})`}
                      opacity={badge.claimedOn === -1 ? 0.3 : 0.8} // Dim placeholder badges
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="14px"
                      _hover={{
                        opacity: badge.claimedOn === -1 ? 0.4 : 1,
                        transform: badge.claimedOn === -1 ? "none" : "scale(1.1)",
                        transition: "all 0.2s",
                      }}
                      cursor={badge.claimedOn === -1 ? "default" : "pointer"}>
                      {badge.claimedOn === -1 ? "🔒" : categoryStyle.icon}
                    </Circle>
                    {badge.claimedOn === 0 && (
                      <Circle
                        cursor="pointer"
                        position="absolute"
                        top="-2px"
                        left="-2px"
                        size="34px"
                        border="2px solid green"
                        animation={pulse}
                        boxShadow="0 0 10px green"
                        onClick={() => {
                          setSelectedBadge({ ...badge });
                          onOpen();
                        }}
                      />
                    )}
                  </Box>
                  <Text
                    className="badge-name"
                    position="absolute"
                    top="100%"
                    left="50%"
                    transform="translateX(-50%)"
                    mt={1}
                    fontSize="xs"
                    opacity={0}
                    visibility="hidden"
                    transition="all 0.2s"
                    whiteSpace="nowrap"
                    color={badge.claimedOn === -1 ? "gray.500" : badge.claimedOn === 0 ? "blue.500" : "inherit"}
                    fontWeight={badge.claimedOn === 0 ? "bold" : "normal"}>
                    {badge.claimedOn === -1 ? "Complete activities to unlock" : badge.claimedOn === 0 ? `${badge.badge} - Claim Now!` : badge.badge}
                  </Text>
                </Box>
              </WrapItem>
            ))}
            <WrapItem>
              <Circle size="30px" bg="gray.200" color="gray.600" fontSize="sm" display="flex" alignItems="center" justifyContent="center" mb="2">
                {badges.length}
              </Circle>
            </WrapItem>
          </Wrap>
        </Box>
      </Popover>

      <ClaimBadgeModal
        isOpen={isOpen}
        onClose={onClose}
        selectedBadge={selectedBadge}
        badgeCategoryMapWithCatNameAsKey={badgeCategoryMapWithCatNameAsKey}
        onClaimBadge={handleClaimBadge}
      />
    </>
  );
};
