import React, { useState, useEffect } from "react";
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
  Tooltip,
  useBreakpointValue,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { BsDot } from "react-icons/bs";
import { FaLaptop, FaUserAstronaut, FaTachometerAlt } from "react-icons/fa";
import { LuFlaskRound } from "react-icons/lu";
import { MdAccountBalanceWallet, MdDarkMode, MdMenu, MdSpaceDashboard, MdOutlineDownloading, MdCheckCircle } from "react-icons/md";
import { RiExchangeFill } from "react-icons/ri";
import { TiArrowSortedDown } from "react-icons/ti";
import { Link as ReactRouterLink, useLocation } from "react-router-dom";
import logoSmlL from "assets/img/logo-icon-b.png";
import logoSmlD from "assets/img/logo-sml-d.png";
import Countdown from "components/CountDown";
import ShortAddress from "components/UtilComps/ShortAddress";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { CHAIN_TOKEN_SYMBOL, CHAINS, MENU, EXPLORER_APP_FOR_TOKEN } from "libs/config";
import { SolEnvEnum } from "libs/Solana/config";
import { formatNumberRoundFloor, computeRemainingCooldown } from "libs/utils";
import { viewDataToOnlyGetReadOnlyBitz } from "pages/GetBitz/GetBitzSol";
import { PlayBitzModal } from "pages/GetBitz/PlayBitzModal";
import { useAccountStore } from "store";
import { useNftsStore } from "store/nfts";

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
  const connectBtnTitle = useBreakpointValue({ base: "Connect Wallet" });
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
          isHidden: false,
          isHiddenOnHeaderBar: true,
        },
        {
          menuEnum: MENU.NFTMINE,
          path: "/datanfts/wallet",
          label: "Data NFT Wallet",
          shortLbl: "Wallet",
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
          needToBeLoggedIn: false,
          isHidden: false,
        },
        {
          menuEnum: MENU.LIVELINESS,
          path: "/liveliness",
          label: "Liveliness Staking",
          shortLbl: "Liveliness",
          Icon: FaTachometerAlt,
          needToBeLoggedIn: true,
          isHidden: false,
        },
      ],
    },
  ];
  const { bitzDataNfts } = useNftsStore();
  const { bitzBalance, cooldown, solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, keyChainDataForAppLoading } = useAccountStore();
  const { updateBitzBalance, updateGivenBitzSum, updateBonusBitzSum, updateCooldown } = useAccountStore();

  // load mini bitz game
  useEffect(() => {
    if (!showPlayBitzModal && triggerBiTzPlayModel) {
      setShowPlayBitzModal(true);
    }
  }, [triggerBiTzPlayModel]);

  // Show the Bitz balance
  useEffect(() => {
    if (bitzDataNfts.length > 0 && solPreaccessNonce !== "" && solPreaccessSignature !== "" && userPublicKey) {
      (async () => {
        const getBitzGameResult = await viewDataToOnlyGetReadOnlyBitz(bitzDataNfts[0], solPreaccessNonce, solPreaccessSignature, userPublicKey);

        if (getBitzGameResult) {
          const bitzBeforePlay = getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay || 0;
          const sumGivenBits = getBitzGameResult.data?.bitsMain?.bitsGivenSum || 0;
          const sumBonusBitz = getBitzGameResult.data?.bitsMain?.bitsBonusSum || 0;

          updateBitzBalance(bitzBeforePlay + sumBonusBitz - sumGivenBits); // collected bits - given bits
          updateGivenBitzSum(sumGivenBits); // given bits -- for power-ups
          updateBonusBitzSum(sumBonusBitz);

          updateCooldown(
            computeRemainingCooldown(
              getBitzGameResult.data.gamePlayResult.lastPlayedBeforeThisPlay,
              getBitzGameResult.data.gamePlayResult.configCanPlayEveryMSecs
            )
          );
        }
      })();
    }
  }, [bitzDataNfts, userPublicKey, solPreaccessNonce, solPreaccessSignature]);

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

  const initJupiter = () => {
    if (!wallet) return;

    window.Jupiter.init({
      onSuccess: ({ txid, swapResult }) => {
        console.log({ txid });
        toast({
          title: "Swap Successful",
          description: "Swap was successful",
          status: "info",
          duration: 15000,
          isClosable: true,
        });
      },
      endpoint: import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC,
      passThroughWallet: wallet,
      containerStyles: { maxHeight: "60vh" },
      formProps: {
        fixedOutputMint: true,
        swapMode: "ExactInOut",
        initialAmount: "100000000",
        initialOutputMint: import.meta.env.VITE_ENV_ITHEUM_SOL_TOKEN_ADDRESS,
        initialInputMint: NATIVE_MINT.toBase58(),
      },
    });
  };

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
              <Image w="45px" ml={{ base: 0, md: 5 }} src={colorMode === "light" ? logoSmlL : logoSmlD} alt="Itheum Data DEX" />
              <Flex flexDirection="column" onClick={onClose}>
                <Heading fontSize={{ base: "md", xl: "xl" }} fontFamily="Clash-Medium" fontWeight="400">
                  Itheum
                </Heading>
                <Heading fontSize={{ base: "sm", xl: "lg" }} fontFamily="Clash-Medium" fontWeight="400" color="teal.200" onClick={onClose}>
                  Data DEX
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
                    mx={"4px"}
                    style={{ textDecoration: "none" }}
                    key={path}
                    display={shouldDisplayQuickMenuItem(quickMenuItem, isUserLoggedIn)}>
                    <Button
                      borderColor="teal.200"
                      fontSize="md"
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
                <Button borderColor="teal.200" fontSize="md" variant="outline" display={"initial"} h={"12"} onClick={() => initJupiter()}>
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
                        What is {`<BiTz>`} XP?
                      </Text>
                      <Text fontSize="md" lineHeight="1.5rem" fontFamily="Satoshi-Regular" py={4} px={3}>
                        {`<BiTz>`} are Itheum Protocol XP. {`<BiTz>`} can be collected every few hours by playing the Get {`<BiTz>`} game Data Widget. Top
                        LEADERBOARD climbers get special perks and drops!
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
                            <span> Claim Your {`<BiTz>`} XP</span>
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
                    localStorage?.removeItem("itm-datacat-linked");
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
            {keyChainDataForAppLoading ? <MdOutlineDownloading size={"1.3em"} /> : <MdCheckCircle size={"1.3em"} />}
          </HStack>
        </Flex>
      </Flex>

      <Box backgroundColor={"#5d3d0d"}>
        <Text textAlign={"center"} fontSize={"small"}>{`preaccessNonce = ${solPreaccessNonce.substring(0, 8)},
       preaccessSig = ${solPreaccessSignature.substring(0, 8)},
      preaccessTS = ${solPreaccessTimestamp > -2 ? new Date(solPreaccessTimestamp).toUTCString() : solPreaccessTimestamp}`}</Text>
      </Box>

      <Drawer placement={"left"} onClose={onClose} isOpen={isOpen} blockScrollOnMount={false}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth={"1px"} display={"flex"} alignItems={"center"} bgColor={colorMode === "dark" ? "#181818" : "bgWhite"}>
            <Heading size={"sm"} onClick={onClose}>
              Itheum Data DEX
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
                            {cooldown <= 0 && cooldown != -2 && (
                              <>
                                <Box
                                  position={"absolute"}
                                  w={"full"}
                                  h={"full"}
                                  left="-20px"
                                  top="-16px"
                                  as={BsDot}
                                  color="#03c797"
                                  size="15px"
                                  animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"></Box>{" "}
                                <Box
                                  position={"absolute"}
                                  w={"full"}
                                  h={"full"}
                                  left="-25px"
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
                                  left="-23px"
                                  top="-25px"
                                  as={BsDot}
                                  color="#03c797"
                                  size="55px"
                                  animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
                                  style={{ animationDelay: "1s" }}></Box>{" "}
                              </>
                            )}
                            <LuFlaskRound fontSize={"1.4rem"} fill="#03c797" />{" "}
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
                              What is {`<BiTz>`} XP?
                            </Text>
                            <Text fontSize="md" lineHeight="1.5rem" fontFamily="Satoshi-Regular" py={4} px={3}>
                              {`<BiTz>`} are Itheum Protocol XP. {`<BiTz>`} can be collected every few hours by playing the Get {`<BiTz>`} game Data Widget. Top
                              LEADERBOARD climbers get special perks and drops!
                            </Text>
                            <Link as={ReactRouterLink} isExternal to={`${EXPLORER_APP_FOR_TOKEN[connectedChain]["bitzgame"]}`}>
                              <Button
                                variant="outline"
                                borderColor="#03c797"
                                rounded="full"
                                w="full"
                                _hover={{ backgroundImage: "linear-gradient(345deg, #171717, #03c797)" }}>
                                Get {`<BiTz>`}
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
  const itheumBalance = useAccountStore((state) => state.itheumBalance);

  return (
    <Box
      display={displayParams}
      fontSize={{ md: "sm", "2xl": "md" }}
      minWidth="5.5rem"
      textAlign="center"
      color="black"
      bgColor="teal.200"
      borderRadius="md"
      paddingX={{ md: "3", xl: "5" }}
      paddingY={{ md: "10px", xl: "14px" }}>
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

export default AppHeader;
