import React from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Text, useColorMode, useBreakpointValue } from "@chakra-ui/react";
import { useMintStore } from "store";
import { NFMeIDMintOptions } from "./NFMeIDMintOptions";

interface NFMeIDMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFreeMint: () => void;
  onMintAndBond: () => void;
}

export const NFMeIDMintModal = ({ isOpen, onClose, onFreeMint, onMintAndBond }: NFMeIDMintModalProps) => {
  const { colorMode } = useColorMode();
  const modelSize = useBreakpointValue({ base: "xs", md: "xl" });
  const { currentMaxApr } = useMintStore();

  return (
    <Modal size={modelSize} isOpen={isOpen} onClose={onClose} closeOnEsc={false} closeOnOverlayClick={false} blockScrollOnMount={false}>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
        <ModalHeader mt={5} textAlign="center" fontSize="2xl" color="teal.200">
          NFMe ID: Choose Your Minting Option
        </ModalHeader>

        <ModalBody>
          <Text mb={6} textAlign="center">
            You can mint your NFMe ID for free, or mint and bond $ITHEUM tokens simultaneously to earn up to{" "}
            <Text as="span" fontWeight="bold" color="teal.200">
              {currentMaxApr}% APR
            </Text>{" "}
            in staking rewards.
          </Text>

          <NFMeIDMintOptions onFreeMint={onFreeMint} onMintAndBond={onMintAndBond} />
        </ModalBody>

        <ModalFooter alignSelf="center">
          <Button variant="outline" onClick={onClose}>
            Back to Dashboard
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
