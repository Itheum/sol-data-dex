import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Flex,
  Circle,
  useColorMode,
  Alert,
  AlertIcon,
  Box,
} from "@chakra-ui/react";
import { useAccountStore } from "store/account";
import { Badge } from "./BadgesPreview";

interface ClaimBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelSize?: string;
  selectedBadge?: Badge;
  badgeCategoryMapWithCatNameAsKey: {
    [key: string]: {
      icon: string;
      shortName: string;
      gradient: string[];
      description: string;
    };
  };
  onClaimBadge: () => Promise<{ success: boolean; message?: string }>;
}

export const ClaimBadgeModal: React.FC<ClaimBadgeModalProps> = ({
  isOpen,
  onClose,
  modelSize = "xl",
  selectedBadge,
  badgeCategoryMapWithCatNameAsKey,
  onClaimBadge,
}) => {
  const { colorMode } = useColorMode();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { userBadges, updateUserBadges } = useAccountStore();

  const handleClaim = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await onClaimBadge();
      if (resp.success) {
        // manually update userBadges state to refresh the UI (no need to get it via API)
        const _userBadges: any[] = [...userBadges];

        _userBadges.forEach((badge) => {
          if (badge.typeIdCatIdLeafId === selectedBadge?.typeIdCatIdLeafId) {
            badge.claimedOn = Date.now();
          }
        });

        updateUserBadges(_userBadges);

        setClaimSuccess(true);
      } else {
        setError(resp.message || "Failed to claim badge");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim badge");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedBadge) return null;

  const categoryStyle = badgeCategoryMapWithCatNameAsKey[selectedBadge.category];
  const issuedDate = new Date(selectedBadge.issuedOn).toLocaleDateString();

  console.log("selectedBadge", selectedBadge);

  return (
    <Modal size={modelSize} isOpen={isOpen} onClose={onClose} closeOnEsc={!isLoading} closeOnOverlayClick={!isLoading} blockScrollOnMount={false}>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
        {!isLoading && <ModalCloseButton />}
        <ModalHeader mt={5} textAlign="center" fontSize="2xl" color="teal.200">
          Claim Your Badge!
        </ModalHeader>
        <ModalBody pb={6}>
          <Flex flexDirection="column" alignItems="center">
            <Circle size="100px" bgGradient={`linear(135deg, ${categoryStyle.gradient[0]}, ${categoryStyle.gradient[1]})`} color="white" fontSize="48px" mb={4}>
              {categoryStyle.icon}
            </Circle>

            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              {categoryStyle.shortName} Badge
            </Text>
            <Text fontSize="xl" fontWeight="bold" textAlign="center" mt={2} color="teal.200">
              {selectedBadge.badge}
            </Text>

            <Text mt="5" textAlign="center">
              {categoryStyle.description}
            </Text>

            <Text mt="3" color="gray.500">
              Issued on: {issuedDate}
            </Text>

            {error && (
              <Alert status="error" mt={5} rounded="md">
                <AlertIcon />
                <Box>
                  <Text>{error}</Text>
                </Box>
              </Alert>
            )}

            {claimSuccess ? (
              <Alert status="success" mt={5} rounded="md">
                <Box m="auto">
                  <Text>Badge successfully claimed! 🎉</Text>
                </Box>
                <Button onClick={onClose}>Close</Button>
              </Alert>
            ) : (
              <Button
                m="auto"
                mt="5"
                colorScheme="teal"
                variant="outline"
                fontSize={{ base: "sm", md: "md" }}
                size={{ base: "sm", lg: "lg" }}
                w="280px"
                isLoading={isLoading}
                onClick={handleClaim}>
                Claim Now!
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
