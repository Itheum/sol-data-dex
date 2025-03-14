import React, { useState, useEffect, useRef } from "react";
import { WarningTwoIcon, SunIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionItem,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  List,
  ListIcon,
  ListItem,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuItemOption,
  MenuList,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BsDot } from "react-icons/bs";
import { FaLaptop, FaUserAstronaut, FaTachometerAlt } from "react-icons/fa";
import { LuFlaskRound } from "react-icons/lu";
import { MdAccountBalanceWallet, MdDarkMode, MdMenu, MdSpaceDashboard, MdOutlineDownloading, MdCheckCircle } from "react-icons/md";
import { RiExchangeFill } from "react-icons/ri";
import { TiArrowSortedDown } from "react-icons/ti";
import { Link as ReactRouterLink, useLocation, useNavigate } from "react-router-dom";
import logoSmlL from "assets/img/logo-icon-b.png";
import logoSmlD from "assets/img/logo-sml-d.png";
import Countdown from "components/CountDown";
import NftMediaComponent from "components/NftMediaComponent";
import ShortAddress from "components/UtilComps/ShortAddress";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { CHAIN_TOKEN_SYMBOL, CHAINS, MENU, EXPLORER_APP_FOR_TOKEN } from "libs/config";
import { SolEnvEnum } from "libs/Solana/config";
import { swapForItheumTokensOnJupiter, getItheumBalanceOnSolana } from "libs/Solana/utils";
import { sleep } from "libs/utils";
import { formatNumberRoundFloor } from "libs/utils";
import { PlayBitzModal } from "pages/GetBitz/PlayBitzModal";
import { useAccountStore, useMintStore, useNftsStore } from "store";

const NFMeIDPanel = ({ nfmeIdDataNft }: { nfmeIdDataNft: any }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { colorMode } = useColorMode();

  // Initial auto-hide after 5 seconds
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle hover state
  useEffect(() => {
    if (isHovered) {
      setIsVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered]);

  const backgroundColor = colorMode === "light" ? "bgWhite" : "bgDark";

  return (
    <Box
      position="fixed"
      top="6.2rem"
      left={isVisible ? { base: "5px", md: "20px" } : { base: "-180px", md: "-160px" }}
      transition="left 0.3s ease-in-out"
      zIndex={1000}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setIsVisible(!isVisible);
        setIsHovered(false);
      }}>
      <Flex alignItems="center">
        <Box
          borderRadius="10px"
          boxShadow="lg"
          p="2"
          border="1px solid"
          borderColor="teal.200"
          bg={backgroundColor}
          cursor="pointer"
          pt="5"
          onClick={() => {
            navigate("/liveliness");
          }}>
          <NftMediaComponent getImgsFromNftMetadataContent={nfmeIdDataNft.content} imageHeight="160px" imageWidth="160px" borderRadius="10px" />
        </Box>
        <Box
          color="black"
          bg="teal.200"
          p="2"
          borderRadius="0 10px 10px 0"
          cursor="pointer"
          _hover={{ bg: "teal.300" }}
          sx={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}>
          Your NFMe ID
        </Box>
      </Flex>
    </Box>
  );
};

const AppHeader = ({
  onShowConnectWalletModal,
  setMenuItem,
  handleLogout,
  onRemoteTriggerOfBiTzPlayModel,
  triggerBiTzPlayModel,
}: {
  onShowConnectWalletModal?: any;
  setMenuItem: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel: any;
  triggerBiTzPlayModel?: boolean;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { networkConfiguration } = useNetworkConfiguration();
  const { publicKey: userPublicKey, wallet } = useWallet();
  const solAddress = userPublicKey?.toBase58();
  const connectedChain = networkConfiguration === "devnet" ? SolEnvEnum.devnet : SolEnvEnum.mainnet;
  const isUserLoggedIn = userPublicKey ? true : false;
  const { colorMode, setColorMode } = useColorMode();
  const { pathname } = useLocation();
  const connectBtnTitle = useBreakpointValue({ base: "Login via Wallet" });
  const [showPlayBitzModal, setShowPlayBitzModal] = useState(false);
  const toast = useToast();
  const exploreRouterMenu = [
    {
      sectionId: "MainSections",
      sectionLabel: "Main Sections",
      sectionItems: [
        {
          menuEnum: MENU.HOME,
          path: "/dashboard",
          label: "Dashboard",
          shortLbl: "Dashboard",
          Icon: MdSpaceDashboard,
          needToBeLoggedIn: true,
          isHidden: false,
        },
        {
          menuEnum: MENU.SELL,
          path: "/mintdata",
          label: "Mint Data NFTs",
          shortLbl: "Mint",
          Icon: RiExchangeFill,
          needToBeLoggedIn: true,
          isHidden: true,
          isHiddenOnHeaderBar: true,
        },
        {
          menuEnum: MENU.NFTMINE,
          path: "/datanfts/wallet",
          label: "Data NFT Wallet",
          shortLbl: "Data Wallet",
          Icon: MdAccountBalanceWallet,
          needToBeLoggedIn: true,
          isHidden: false,
        },
        {
          menuEnum: MENU.NFMEID,
          path: "/NFMeID",
          label: "NFMe ID",
          shortLbl: "NFMe ID",
          Icon: FaUserAstronaut,
          needToBeLoggedIn: true,
          isHidden: false,
        },
        {
          menuEnum: MENU.LIVELINESS,
          path: "/liveliness",
          label: "Liveliness Staking",
          shortLbl: "Staking",
          Icon: FaTachometerAlt,
          needToBeLoggedIn: true,
          isHidden: false,
        },
      ],
    },
  ];
  const { bitzBalance, cooldown, keyChainDataForAppLoading } = useAccountStore();
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);
  const { connection } = useConnection();

  const { usersNfMeIdVaultBondId, userBonds, nfmeIdDataNft, updateNfmeIdDataNft } = useMintStore();
  const { allDataNfts } = useNftsStore();

  // load mini bitz game
  useEffect(() => {
    if (!showPlayBitzModal && triggerBiTzPlayModel) {
      setShowPlayBitzModal(true);
    }
  }, [triggerBiTzPlayModel]);

  useEffect(() => {
    if (!nfmeIdDataNft) {
      if (usersNfMeIdVaultBondId > 0 && allDataNfts.length > 0 && userBonds.length > 0) {
        const nfMeIdBond = userBonds.find((_userBond) => _userBond.bondId === usersNfMeIdVaultBondId);
        if (nfMeIdBond) {
          const nfmeIdDataNft = allDataNfts?.find((_dataNft) => nfMeIdBond.assetId.toString() === _dataNft.id);
          if (nfmeIdDataNft) {
            updateNfmeIdDataNft(nfmeIdDataNft);
          }
        }
      }
    }
  }, [nfmeIdDataNft, allDataNfts, usersNfMeIdVaultBondId, userBonds]);

  const navigateToDiscover = (menuEnum: number) => {
    setMenuItem(menuEnum);

    if (isOpen) onClose();
  };

  function isMenuItemSelected(itemPath: string): boolean {
    return pathname.startsWith(itemPath);
  }

  const menuButtonDisabledStyle = (itemPath: string) => {
    let styleProps: any = {
      cursor: "not-allowed",
    };
    if (isMenuItemSelected(itemPath) && colorMode === "dark") {
      styleProps = {
        backgroundColor: "#44444450",
        opacity: 0.6,
        ...styleProps,
      };
    } else if (isMenuItemSelected(itemPath) && colorMode !== "dark") {
      styleProps = {
        backgroundColor: "#EDF2F7",
        ...styleProps,
      };
    }
    return styleProps;
  };

  const chainFriendlyName = CHAINS[connectedChain as keyof typeof CHAINS];

  return (
    <>
      <Flex
        h="6rem"
        justifyContent={isUserLoggedIn ? "space-around" : "inherit"}
        paddingX={!isUserLoggedIn ? { base: 5, md: 20, xl: 36 } : 0}
        alignItems="center"
        backgroundColor={colorMode === "light" ? "bgWhite" : "bgDark"}
        borderBottom="solid .1rem"
        borderColor="teal.200"
        paddingY="5">
        <HStack alignItems={"center"} width={{ base: "full", md: "14.5rem" }} justifyContent={{ base: "initial", md: "space-around" }}>
          {isUserLoggedIn && (
            <IconButton
              fontSize="2rem"
              variant="ghost"
              mx="1rem"
              icon={
                <MdMenu
                  style={{
                    transform: "translateX(15%)",
                  }}
                />
              }
              display={{
                md: "none",
              }}
              textColor="teal.200"
              aria-label={"Open Menu"}
              onClick={isOpen ? onClose : onOpen}
            />
          )}

          <Link
            as={ReactRouterLink}
            to={"/"}
            style={{ textDecoration: "none", pointerEvents: undefined }}
            onClick={() => {
              navigateToDiscover(MENU.LANDING);
            }}>
            <HStack>
              <Image w="45px" ml={{ base: 0, md: 5 }} src={colorMode === "light" ? logoSmlL : logoSmlD} alt="Itheum AI Workforce" />
              <Flex flexDirection="column" onClick={onClose}>
                <Heading fontSize={{ base: "md", xl: "xl" }} fontFamily="Clash-Medium" fontWeight="400">
                  Itheum
                </Heading>
                <Heading fontSize={{ base: "sm", xl: "lg" }} fontFamily="Clash-Medium" fontWeight="400" color="teal.200" onClick={onClose}>
                  AI Workforce
                </Heading>
              </Flex>
            </HStack>
          </Link>
        </HStack>
        <Flex mr={{ base: "1rem" }}>
          <HStack alignItems={"center"} spacing={2}>
            <HStack display={{ base: "none", md: "none", xl: "block", "2xl": "block" }}>
              {exploreRouterMenu[0].sectionItems.map((quickMenuItem) => {
                const { path, menuEnum, shortLbl, isHidden, isHiddenOnHeaderBar, Icon } = quickMenuItem;
                return (
                  <Link
                    as={ReactRouterLink}
                    to={path}
                    mx={"2px"}
                    style={{ textDecoration: "none" }}
                    key={path}
                    display={shouldDisplayQuickMenuItem(quickMenuItem, isUserLoggedIn)}>
                    <Button
                      borderColor="teal.200"
                      fontSize="sm"
                      variant="outline"
                      display={isHidden || isHiddenOnHeaderBar ? "none" : "initial"}
                      h={"12"}
                      isDisabled={isMenuItemSelected(path)}
                      _disabled={menuButtonDisabledStyle(path)}
                      key={shortLbl}
                      size={isUserLoggedIn ? "sm" : "md"}
                      onClick={() => navigateToDiscover(menuEnum)}>
                      <Flex justifyContent="center" alignItems="center" px={{ base: 0, "2xl": 1.5 }} color="teal.200" pointerEvents="none">
                        <Icon size={"1.3em"} />
                        <Text pl={2} color={colorMode === "dark" ? "white" : "black"}>
                          {shortLbl}
                        </Text>
                      </Flex>
                    </Button>
                  </Link>
                );
              })}

              {isUserLoggedIn && (
                <Button
                  mx={"2px"}
                  borderColor="teal.200"
                  fontSize="sm"
                  variant="outline"
                  display={"initial"}
                  h={"12"}
                  onClick={() => {
                    swapForItheumTokensOnJupiter(wallet, async () => {
                      toast({
                        title: "Swap Successful",
                        description: "$ITHEUM token swap was successful",
                        status: "info",
                        duration: 15000,
                        isClosable: true,
                      });

                      // update token balance
                      await sleep(2);

                      const itheumTokens = await getItheumBalanceOnSolana(connection, userPublicKey!);
                      if (itheumTokens != undefined) {
                        updateItheumBalance(itheumTokens);
                      } else {
                        updateItheumBalance(-1);
                      }
                    });
                  }}>
                  {" "}
                  Get $ITHEUM
                </Button>
              )}
            </HStack>

            {isUserLoggedIn && (
              <>
                <ItheumTokenBalanceBadge displayParams={["none", null, "block"]} connectedChain={connectedChain} />
                <LoggedInChainBadge chain={chainFriendlyName} displayParams={["none", null, "block"]} />
                <Box display={{ base: "none", md: "block" }} zIndex="11">
                  {exploreRouterMenu.map((menu) => (
                    <Menu key={menu.sectionId} isLazy>
                      <MenuButton as={Button} size={{ md: "md", "2xl": "lg" }} rightIcon={<TiArrowSortedDown size="18px" />}>
                        <ShortAddress address={solAddress} fontSize="md" />
                      </MenuButton>
                      <MenuList maxW={"fit-content"} backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                        {menu.sectionItems.map((menuItem) => {
                          const { label, path, menuEnum, isHidden, Icon } = menuItem;
                          return (
                            <Link as={ReactRouterLink} to={path} style={{ textDecoration: "none" }} key={path}>
                              <MenuItem
                                key={label}
                                isDisabled={isMenuItemSelected(path)}
                                onClick={() => navigateToDiscover(menuEnum)}
                                display={isHidden ? "none" : "flex"}
                                color="teal.200"
                                backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                                <Icon size={"1.25em"} style={{ marginRight: "1rem" }} />
                                <Text color={colorMode === "dark" ? "bgWhite" : "black"}>{label}</Text>
                              </MenuItem>
                            </Link>
                          );
                        })}

                        <MenuDivider />

                        <MenuGroup title="My Address Quick Copy">
                          {solAddress && (
                            <MenuItemOption closeOnSelect={false} backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                              <Text as={"div"} color="teal.200" fontWeight={"bold"}>
                                <ShortAddress address={solAddress} fontSize="md" marginLeftSet="-20px" isCopyAddress={true} />
                              </Text>
                            </MenuItemOption>
                          )}
                          <MenuDivider />
                        </MenuGroup>

                        <MenuGroup>
                          <MenuItem onClick={handleLogout} fontSize="lg" fontWeight="500" backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                            Logout
                          </MenuItem>
                        </MenuGroup>
                      </MenuList>
                    </Menu>
                  ))}
                </Box>
                <Popover>
                  <PopoverTrigger>
                    <Button display={{ base: "none", md: "inline-flex" }} size={{ md: "md", xl: "md", "2xl": "lg" }} p="2 !important">
                      {bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}
                      <FlaskBottleAnimation cooldown={cooldown} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={colorMode === "dark" ? "bgDark" : "white"} w="25rem">
                    <PopoverCloseButton />
                    <PopoverBody pt={5} justifyContent="center" alignItems="center" w="full">
                      <Flex w="full" justifyContent="center" alignItems="center" py={4}>
                        <Box shadow="#03c797" boxShadow="inset 0 2px 4px 0 #03c797" w="3.5rem" h="3.5rem" rounded="lg">
                          <Flex w="full" justifyContent="center" alignItems="center" h="3.5rem">
                            <LuFlaskRound fontSize={"1.7rem"} fill="#03c797" />
                          </Flex>
                        </Box>
                      </Flex>

                      <Text textAlign="center" fontFamily="Clash-Medium" fontSize="2xl">
                        What is {`BiTz`} XP?
                      </Text>
                      <Text fontSize="md" lineHeight="1.5rem" fontFamily="Satoshi-Regular" py={4} px={3}>
                        {`BiTz`} are Itheum Protocol XP. {`BiTz`} can be collected every few hours by playing the Get {`BiTz`} game Data Widget. Top LEADERBOARD
                        climbers get special perks and drops!
                      </Text>
                      <Button
                        onClick={() => setShowPlayBitzModal(true)}
                        variant="outline"
                        borderColor="#03c797"
                        rounded="full"
                        w="full"
                        _hover={{ backgroundImage: "linear-gradient(345deg, #171717, #03c797)" }}>
                        <span>
                          {cooldown === -2 ? (
                            <span>Check XP Balance & Play</span>
                          ) : cooldown > 0 ? (
                            <Countdown unixTime={cooldown} />
                          ) : (
                            <span> Claim Your {`BiTz`} XP</span>
                          )}
                        </span>
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </>
            )}

            {onShowConnectWalletModal && !isUserLoggedIn && (
              <>
                <Button
                  colorScheme="teal"
                  fontSize={{ base: "sm", md: "md" }}
                  size={{ base: "sm", lg: "lg" }}
                  onClick={() => {
                    onShowConnectWalletModal("sol");
                  }}>
                  {connectBtnTitle}
                </Button>
              </>
            )}

            {/* Data / Light Mode */}
            <Box
              display={{
                base: isUserLoggedIn ? "block" : "none",
                md: "block",
              }}>
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Options"
                  size={{ md: "md", xl: "md", "2xl": "lg" }}
                  p="2 !important"
                  color="teal.200"
                  icon={colorMode === "light" ? <SunIcon fontSize={"1.4rem"} /> : <MdDarkMode fontSize={"1.4rem"} />}
                  variant="solid"
                />
                <MenuList backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                  <MenuItem
                    icon={<SunIcon color="teal.200" />}
                    onClick={() => setColorMode("light")}
                    backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                    Light
                  </MenuItem>
                  <MenuItem
                    icon={<MdDarkMode color="#00C797" />}
                    onClick={() => setColorMode("dark")}
                    backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                    Dark
                  </MenuItem>
                  <MenuItem
                    icon={<FaLaptop color="#00C797" />}
                    onClick={() => setColorMode("system")}
                    backgroundColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
                    System
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>

            {isUserLoggedIn && (
              <Box title="on-chain data sync indicator">
                {keyChainDataForAppLoading ? <MdOutlineDownloading size={"1.3em"} /> : <MdCheckCircle size={"1.3em"} />}
              </Box>
            )}
          </HStack>
        </Flex>
      </Flex>

      <Drawer placement={"left"} onClose={onClose} isOpen={isOpen} blockScrollOnMount={false}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth={"1px"} display={"flex"} alignItems={"center"} bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
            <Heading size={"sm"} onClick={onClose}>
              Itheum AI Workforce
            </Heading>
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerBody p={0} bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
            <Accordion allowMultiple>
              {exploreRouterMenu.map((menu) => (
                <AccordionItem key={menu.sectionId}>
                  {() => (
                    <>
                      <Popover>
                        <PopoverTrigger>
                          <Flex px={4} pb={1.5} position={"relative"} w={"100px"} mt={3}>
                            <FlaskBottleAnimation cooldown={cooldown} />
                            {bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}
                          </Flex>
                        </PopoverTrigger>
                        <PopoverContent backgroundColor="bgDark" w="18rem">
                          <PopoverCloseButton />
                          <PopoverBody pt={5} justifyContent="center" alignItems="center" w="full">
                            <Flex w="full" justifyContent="center" alignItems="center" py={4}>
                              <Box shadow="#03c797" boxShadow="inset 0 2px 4px 0 #03c797" w="3.5rem" h="3.5rem" rounded="lg">
                                <Flex w="full" justifyContent="center" alignItems="center" h="3.5rem">
                                  <LuFlaskRound fontSize={"1.7rem"} fill="#03c797" />
                                </Flex>
                              </Box>
                            </Flex>
                            <Text textAlign="center" fontFamily="Clash-Medium" fontSize="2xl">
                              What is {`BiTz`} XP?
                            </Text>
                            <Text fontSize="md" lineHeight="1.5rem" fontFamily="Satoshi-Regular" py={4} px={3}>
                              {`BiTz`} are Itheum Protocol XP. {`BiTz`} can be collected every few hours by playing the Get {`BiTz`} game Data Widget. Top
                              LEADERBOARD climbers get special perks and drops!
                            </Text>
                            <Link as={ReactRouterLink} isExternal to={`${EXPLORER_APP_FOR_TOKEN[connectedChain]["bitzgame"]}`}>
                              <Button
                                variant="outline"
                                borderColor="#03c797"
                                rounded="full"
                                w="full"
                                _hover={{ backgroundImage: "linear-gradient(345deg, #171717, #03c797)" }}>
                                Get {`BiTz`}
                              </Button>
                            </Link>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                      <Text as={"header"} fontWeight="700" fontSize="md" ml={4}>
                        My Address Quick Copy
                      </Text>
                      {solAddress && (
                        <Text as={"div"} m={"2 !important"} pl={8} color="teal.200" fontWeight={"bold"}>
                          <ShortAddress address={solAddress} fontSize="md" marginLeftSet="-20px" isCopyAddress={true} />
                        </Text>
                      )}
                      <hr />
                      <List>
                        {menu.sectionItems.map((menuItem) => {
                          const { label, menuEnum, path, isHidden, Icon } = menuItem;
                          return (
                            <Link as={ReactRouterLink} to={path} style={{ textDecoration: "none" }} key={path}>
                              <ListItem
                                as={Button}
                                variant={"ghost"}
                                w={"full"}
                                borderRadius={"0"}
                                display={isHidden ? "none" : "flex"}
                                justifyContent={"start"}
                                p={3}
                                key={label}
                                onClick={() => navigateToDiscover(menuEnum)}>
                                <ListIcon
                                  as={() =>
                                    Icon({
                                      size: "1.25em",
                                      style: { marginRight: "0.75rem" },
                                    })
                                  }
                                />
                                <Text mt={-1}>{label}</Text>
                              </ListItem>
                            </Link>
                          );
                        })}
                        <ListItem
                          as={Button}
                          variant={"ghost"}
                          w={"full"}
                          borderRadius={"0"}
                          display={"flex"}
                          justifyContent={"start"}
                          p={3}
                          onClick={handleLogout}>
                          Logout
                        </ListItem>
                      </List>
                    </>
                  )}
                </AccordionItem>
              ))}
            </Accordion>

            <Stack width="60%" spacing="3" m="1rem auto">
              <LoggedInChainBadge chain={chainFriendlyName} displayParams={["block", null, "none"]} />
              <ItheumTokenBalanceBadge displayParams={["block", null, "none"]} connectedChain={connectedChain} />
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {showPlayBitzModal && (
        <PlayBitzModal
          showPlayBitzModel={showPlayBitzModal}
          handleHideBitzModel={() => {
            onRemoteTriggerOfBiTzPlayModel(false);
            setShowPlayBitzModal(false);
          }}
        />
      )}

      {nfmeIdDataNft && <NFMeIDPanel nfmeIdDataNft={nfmeIdDataNft} />}
    </>
  );
};

function shouldDisplayQuickMenuItem(quickMenuItem: any, isUserLoggedIn: boolean) {
  if (quickMenuItem.needToBeLoggedOut === undefined) {
    return quickMenuItem.needToBeLoggedIn ? (isUserLoggedIn ? "inline" : "none") : "inline";
  } else {
    return quickMenuItem.needToBeLoggedOut ? (isUserLoggedIn ? "none" : "inline") : "inline";
  }
}

function ItheumTokenBalanceBadge({ displayParams, connectedChain }: { displayParams: any; connectedChain: any }) {
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();

  const { itheumBalance, updateItheumBalance } = useAccountStore();

  return (
    <Box
      display={displayParams}
      fontSize={{ md: "sm", "2xl": "md" }}
      cursor="pointer"
      title="Click to Refresh Your Balance"
      minWidth="5.5rem"
      textAlign="center"
      color="black"
      bgColor="teal.200"
      borderRadius="md"
      paddingX={{ md: "3", xl: "5" }}
      paddingY={{ md: "10px", xl: "14px" }}
      onClick={() => {
        // refresh users sol $ITHEUM Balance
        (async () => {
          if (!userPublicKey) {
            return;
          }

          const itheumTokens = await getItheumBalanceOnSolana(connection, userPublicKey);
          if (itheumTokens != undefined) {
            updateItheumBalance(itheumTokens);
          } else {
            updateItheumBalance(-1);
          }
        })();
      }}>
      {itheumBalance === -1 ? (
        <Spinner size="xs" />
      ) : itheumBalance === -2 ? (
        <WarningTwoIcon />
      ) : (
        <>
          {CHAIN_TOKEN_SYMBOL(connectedChain)} {formatNumberRoundFloor(itheumBalance)}
        </>
      )}
    </Box>
  );
}

function LoggedInChainBadge({ chain, displayParams }: { chain: any; displayParams: any }) {
  return (
    <Box
      display={displayParams}
      fontSize={{ md: "sm", "2xl": "md" }}
      textAlign="center"
      color="teal.200"
      fontWeight="semibold"
      borderRadius="md"
      height="2rem"
      padding={{ md: "6px 5px", xl: "6px 11px" }}>
      {chain || "..."}
    </Box>
  );
}

function FlaskBottleAnimation(props: any) {
  const { cooldown } = props;

  return (
    <>
      <LuFlaskRound fontSize={"1.4rem"} fill="#03c797" />
      {cooldown <= 0 && cooldown != -2 && (
        <>
          {" "}
          <Box
            position={"absolute"}
            w={"full"}
            h={"full"}
            right="-15px"
            top="-15px"
            as={BsDot}
            color="#03c797"
            size="15px"
            animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"></Box>{" "}
          <Box
            position={"absolute"}
            w={"full"}
            h={"full"}
            right="-8px"
            top="-18px"
            as={BsDot}
            color="#03c797"
            size="15px"
            animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
            style={{ animationDelay: "0.5s" }}></Box>{" "}
          <Box
            position={"absolute"}
            w={"full"}
            h={"full"}
            right="-12px"
            top="-25px"
            as={BsDot}
            color="#03c797"
            size="55px"
            animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
            style={{ animationDelay: "1s" }}></Box>{" "}
        </>
      )}
    </>
  );
}

export default AppHeader;
