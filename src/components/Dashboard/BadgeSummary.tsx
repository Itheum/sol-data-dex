import React from "react";
import { Box, Wrap, WrapItem, Circle, Text, HStack, Flex, keyframes, useColorMode } from "@chakra-ui/react";
import { Badge } from "./BadgesPreview";

interface BadgeSummaryProps {
  badgeCategoryMapWithCatNameAsKey: { [key: string]: { icon: string; shortName: string; gradient: string[]; description: string } };
  groupedBadges: Record<string, Badge[]>;
  onUserClick: any;
  badgeSummaryHeaderMode?: boolean;
  showStage2Disclaimer?: boolean;
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

export const BadgeSummary: React.FC<BadgeSummaryProps> = ({
  badgeCategoryMapWithCatNameAsKey,
  groupedBadges,
  onUserClick,
  badgeSummaryHeaderMode = false,
  showStage2Disclaimer = false,
}) => {
  const { colorMode } = useColorMode();

  // Calculate claimed and unclaimed totals
  const badgeCounts = Object.values(groupedBadges).reduce(
    (acc, badges) => {
      badges.forEach((badge) => {
        if (badge.claimedOn === 0) {
          acc.unclaimed += 1;
        } else {
          acc.claimed += 1;
        }
      });
      return acc;
    },
    { claimed: 0, unclaimed: 0 }
  );

  return (
    <>
      <Box p={badgeSummaryHeaderMode ? 1 : 4} borderWidth="1px" borderRadius="lg" mb={4} boxShadow="sm">
        {showStage2Disclaimer && (
          <Text textAlign="center" fontSize="sm">
            ❗ You need to complete STAGE 2 to access badges!
          </Text>
        )}
        <Flex flexDirection="column" justify="space-between" mb={badgeSummaryHeaderMode ? 0 : 3}>
          <Flex align="center" gap={2} flexDirection="column">
            <Text fontSize="lg" fontWeight="bold">
              {badgeSummaryHeaderMode ? "" : "Your Badge Collection"}
            </Text>
            <Text fontSize="md" color="gray.600">
              {badgeSummaryHeaderMode ? "Badges " : ""} ({badgeCounts.claimed} claimed • {badgeCounts.unclaimed} pending)
            </Text>
          </Flex>
        </Flex>

        <Wrap spacing={4} justify={"center"}>
          {Object.entries(groupedBadges).map(([category, badges]) => {
            const categoryStyle = badgeCategoryMapWithCatNameAsKey[category] || {
              icon: "🏆",
              shortName: category,
              gradient: ["blue.400", "teal.400"],
            };

            const hasUnclaimedInCategory = badges.some((badge) => badge.claimedOn === 0);

            return (
              <WrapItem key={category}>
                <Box
                  position="relative"
                  _hover={{
                    "& > .category-tooltip": {
                      opacity: 1,
                      visibility: "visible",
                    },
                  }}>
                  <Box position="relative">
                    <HStack spacing={2} p={2} borderRadius="full" _hover={{ bg: "gray.100" }} cursor="pointer" onClick={onUserClick}>
                      <Box position="relative">
                        <Circle
                          size="30px"
                          bgGradient={`linear(135deg, ${categoryStyle.gradient[0]}, ${categoryStyle.gradient[1]})`}
                          color="white"
                          fontSize="16px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center">
                          {categoryStyle.icon}
                        </Circle>
                        {hasUnclaimedInCategory && (
                          <Circle
                            position="absolute"
                            top="-2px"
                            left="-2px"
                            size="34px"
                            border="2px solid"
                            borderColor="teal.400"
                            animation={pulse}
                            boxShadow="0 0 10px teal.200"
                          />
                        )}
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" color={colorMode === "dark" ? "white" : "#181818"}>
                        {badges.length}
                      </Text>
                    </HStack>
                  </Box>
                  <Box
                    className="category-tooltip"
                    position="absolute"
                    top="100%"
                    left="50%"
                    transform="translateX(-50%)"
                    mt={2}
                    p={2}
                    bg="gray.800"
                    color="white"
                    borderRadius="md"
                    fontSize="sm"
                    opacity={0}
                    visibility="hidden"
                    transition="all 0.2s"
                    whiteSpace="nowrap"
                    zIndex={1}>
                    <Text textAlign="center">
                      {category}
                      <br />
                      {badges.length} badge{badges.length !== 1 ? "s" : ""}
                      {hasUnclaimedInCategory && (
                        <Text color="teal.200" fontWeight="bold">
                          Unclaimed badges available!
                        </Text>
                      )}
                    </Text>
                  </Box>
                </Box>
              </WrapItem>
            );
          })}
        </Wrap>
      </Box>
    </>
  );
};
