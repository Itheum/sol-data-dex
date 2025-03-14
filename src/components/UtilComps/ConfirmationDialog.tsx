import React from "react";
import {
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogBody,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCloseButton,
} from "@chakra-ui/react";

export function ConfirmationDialog({
  dialogData: { title, proceedBtnTxt, cancelBtnText, proceedBtnColorScheme },
  isCentered,
  bodyContent,
  isOpen,
  onCancel,
  onProceed,
}: {
  dialogData: { title: string; proceedBtnTxt: string; cancelBtnText: string; proceedBtnColorScheme?: string };
  isCentered?: boolean;
  bodyContent: React.ReactNode;
  isOpen: boolean;
  onCancel: () => void;
  onProceed: () => void;
}) {
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;

  return (
    <>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onCancel}
        isOpen={isOpen}
        isCentered={isCentered === false ? false : true}
        size={{ base: "md", md: "lg" }}>
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>{title}</AlertDialogHeader>
          {cancelBtnText.trim() !== "" && <AlertDialogCloseButton />}
          <AlertDialogBody>{bodyContent}</AlertDialogBody>
          <AlertDialogFooter>
            {cancelBtnText.trim() !== "" && (
              <Button ref={cancelRef} onClick={onCancel}>
                {cancelBtnText}
              </Button>
            )}
            {proceedBtnTxt.trim() !== "" && (
              <Button colorScheme={proceedBtnColorScheme || "teal"} ml={3} onClick={onProceed}>
                {proceedBtnTxt}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
