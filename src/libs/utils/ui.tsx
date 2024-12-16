import React from "react";
import { Box, Link } from "@chakra-ui/react";
import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Function to transform description that have a link into an actual link
export const transformDescription = (description: string) => {
  const regex = /(?:^|[\s\n])(?:\((.*?)\))?((?:https?:\/\/|www\.)[^\s\n]+)/g; // Regex for check if description have link

  return description.split(regex).map((word, i) => {
    if (word?.match(regex)) {
      return (
        <Link key={i} href={word} isExternal color={"blue.300"}>
          {" " + word}
        </Link>
      );
    }
    return word;
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const scrollToSection = (sectionId: string, addMoreOffset?: number) => {
  const section = document.getElementById(sectionId);

  if (section) {
    window.scrollTo({
      top: section.offsetTop + (addMoreOffset || 0),
      behavior: "smooth",
    });
  }
};

export function FocusOnThisEffect({ top, left }: { top?: string; left?: string }) {
  return (
    <Box className="absolute flex h-5 w-5" style={{ top: top || "initial", left: left || "initial" }}>
      <Box className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03c797] opacity-75"></Box>
    </Box>
  );
}
