import React from "react";
import { Box, Button, Stack, Flex, Modal, ModalBody, ModalContent, ModalOverlay, Text, useColorMode } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export interface ProcureDataNFTSuccessCTAModelProps {
  isOpen: boolean;
  onClose: () => void;
  congratsActionMsg: string;
}

export default function KeyActionSuccessCTAModel({ isOpen, onClose, congratsActionMsg }: ProcureDataNFTSuccessCTAModelProps) {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} closeOnEsc={false} closeOnOverlayClick={false}>
        <ModalOverlay bg="#00c79794" />
        <ModalContent bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
          <ModalBody py={6}>
            <Text fontSize={"22px"} textAlign="center" fontWeight="bold" mb="3" color="teal.200">
              Congrats on {congratsActionMsg}
            </Text>

            <Flex flexDirection="column" mt="8 !important">
              <Text fontSize="xl" textAlign="center" fontWeight="bold">
                What Next?
              </Text>

              {/* @TODO, make this dynamic as needed for the host component */}
              <Text textAlign="center" my="2">
                Visit the Liveliness page to view your bond, claim rewards, set up a Vault, top up bonds, and more.
              </Text>
              <Button
                colorScheme="teal"
                size={{ base: "sm", md: "md", xl: "lg" }}
                m={2}
                onClick={() => {
                  navigate("/liveliness");
                }}>
                Go to Liveliness
              </Button>

              <Text textAlign="center" my="2">
                Or, head back to your dashboard where you can continue your Itheum journey.
              </Text>
              <Button
                colorScheme="teal"
                size={{ base: "sm", md: "md", xl: "lg" }}
                m={2}
                onClick={() => {
                  navigate("/dashboard");
                }}>
                Go to Dashboard
              </Button>

              <Button colorScheme="teal" size={{ base: "sm", md: "md", xl: "lg" }} variant="outline" onClick={onClose} m={2}>
                Close This
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
