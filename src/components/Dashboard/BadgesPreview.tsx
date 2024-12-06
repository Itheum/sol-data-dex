import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Flex,
  Text,
  Heading,
  Box,
  Button,
  Collapse,
  AlertIcon,
  Alert,
  SkeletonCircle,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";
import { fetchBadgesLookup } from "libs/Solana/utils";
import { useAccountStore } from "store/account";
import { BadgeCard } from "./BadgeCard";
import { BadgeSummary } from "./BadgeSummary";

interface BadgesPreviewProps {
  isUserLoggedIn: boolean;
  onHasUnclaimedBadges: (status: boolean) => void;
}

export interface Badge {
  badge: string;
  category: string;
  issuedOn: number;
  claimedOn: number;
  typeIdCatIdLeafId: string;
}

interface BadgeMetadataType {
  [key: string]: {
    icon: string;
    shortName: string;
    gradient: string[];
    description: string;
    categoryId: string;
  };
}

const BadgesPreview: React.FC<BadgesPreviewProps> = ({ isUserLoggedIn, onHasUnclaimedBadges }) => {
  const { userBadges } = useAccountStore();
  const [userBadgesReadable, setUserBadgesReadable] = useState<Badge[]>([]);
  const [groupedBadges, setGroupedBadges] = useState<Record<string, any[]>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [hasUnclaimedBadges, setHasUnclaimedBadges] = useState(false);
  const [badgeCategoryMap, setBadgeCategoryMap] = useState<object | undefined>();
  const [badgeCategoryMapWithCatNameAsKey, setBadgeCategoryMapWithCatNameAsKey] = useState<BadgeMetadataType>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode } = useColorMode();

  useEffect(() => {
    (async () => {
      // fetch the badge lookup from the API
      const _badgeLookup = await fetchBadgesLookup();
      setBadgeCategoryMap(_badgeLookup);

      const _rawBadgesToReadableDataset: any[] = [...userBadges];

      _rawBadgesToReadableDataset.forEach((rawBadge: any) => {
        const splitParts = rawBadge.typeIdCatIdLeafId.split("-");
        rawBadge.category = _badgeLookup[splitParts[1]].categoryName;
        rawBadge.badge = _badgeLookup[splitParts[1]].badges[splitParts[2]].badgeName;
      });

      // convert to readable format (as the db format is raw and uses IDs etc)
      setUserBadgesReadable(_rawBadgesToReadableDataset);
    })();
  }, [userBadges]);

  // convert badgeCategoryMap (from API, which gives you the details of each badge category) to badgeCategoryMapWithCatNameAsKey (where we just flip the key from a ID to the category name) so it's easier to use in the UI
  useEffect(() => {
    const metadata = Object.entries(badgeCategoryMap || {}).reduce<BadgeMetadataType>((acc, [categoryId, category]: [string, any]) => {
      acc[category.categoryName] = {
        ...category,
        categoryId,
      };
      return acc;
    }, {});

    setBadgeCategoryMapWithCatNameAsKey(metadata);
  }, [badgeCategoryMap]);

  useEffect(() => {
    const _groupedBadges = Object.entries(badgeCategoryMapWithCatNameAsKey).reduce((acc: Record<string, any[]>, [category]) => {
      acc[category] = userBadgesReadable.filter((badge) => badge.category === category);
      return acc;
    }, {});

    setGroupedBadges(_groupedBadges);

    const _hasUnclaimedBadges = Object.values(_groupedBadges).some((badges) => badges.some((badge) => badge.claimedOn === 0));
    setHasUnclaimedBadges(_hasUnclaimedBadges);

    setTimeout(() => {
      setBadgesLoading(false);
    }, 5000);
  }, [userBadgesReadable, badgeCategoryMapWithCatNameAsKey]);

  useEffect(() => {
    onHasUnclaimedBadges(hasUnclaimedBadges);
  }, [hasUnclaimedBadges]);

  return (
    <Flex flexDirection="column" gap={2} p={2} opacity={!isUserLoggedIn ? 0.5 : "initial"} pointerEvents={!isUserLoggedIn ? "none" : "initial"}>
      <Heading as="h3" size="md" textAlign="center">
        Badges
      </Heading>

      <Text
        textAlign="center"
        fontSize="md"
        title="When you Grow your reputation and Co-Create with AI, your key achievements translate into badges that you can display proudly on your NFMe ID. If you have a NFMe ID Vault with ITHEUM bonds then Monthly badges also earn you bonus ITHEUM rewards that you can top-up your vault for extra APR.">
        Earn badges through reputation growth and AI co-creation to get bonus ITHEUM rewards monthly.
      </Text>

      <Text textAlign="center" fontSize="sm">
        Badges are sent out on the 1st of every month.
      </Text>

      {badgesLoading ? (
        <Flex mt={2} gap={2} alignItems="center" justifyContent="center">
          <SkeletonCircle size="10" />
          <SkeletonCircle size="10" />
          <SkeletonCircle size="10" />
        </Flex>
      ) : (
        <>
          <BadgeSummary groupedBadges={groupedBadges} badgeCategoryMapWithCatNameAsKey={badgeCategoryMapWithCatNameAsKey} />

          {hasUnclaimedBadges && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Text fontSize="md">You have Unclaimed Badges! Expand Below and Claim them Now!</Text>
            </Alert>
          )}

          <Button
            variant="ghost"
            onClick={() => (isMobile ? setIsExpanded(!isExpanded) : setIsModalOpen(true))}
            rightIcon={isMobile && isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            _hover={{ bg: colorMode === "dark" ? "#181818" : "bgWhite" }}>
            {isMobile && isExpanded ? "Show Less" : "See All Badges"}
          </Button>

          {/* Collapse panel for mobile */}
          {isMobile && (
            <Collapse in={isExpanded} animateOpacity>
              <Box>
                {Object.entries(groupedBadges).length > 0 ? (
                  Object.entries(groupedBadges).map(([category, badges]) => (
                    <BadgeCard key={category} badgeCategoryMapWithCatNameAsKey={badgeCategoryMapWithCatNameAsKey} category={category} badges={badges} />
                  ))
                ) : (
                  <Alert status="info" borderRadius="md" mb={4}>
                    <AlertIcon />
                    <Text fontSize="md">No badges earned yet. Complete activities to earn badges!</Text>
                  </Alert>
                )}
              </Box>
            </Collapse>
          )}

          {/* Modal for desktop */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} closeOnEsc={false} closeOnOverlayClick={false} blockScrollOnMount={false}>
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
              <ModalHeader>All Badges</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {Object.entries(groupedBadges).length > 0 ? (
                  Object.entries(groupedBadges).map(([category, badges]) => (
                    <BadgeCard key={category} badgeCategoryMapWithCatNameAsKey={badgeCategoryMapWithCatNameAsKey} category={category} badges={badges} />
                  ))
                ) : (
                  <Alert status="info" borderRadius="md" mb={4}>
                    <AlertIcon />
                    <Text fontSize="md">No badges earned yet. Complete activities to earn badges!</Text>
                  </Alert>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Flex>
  );
};

export default BadgesPreview;
