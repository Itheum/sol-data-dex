import React, { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppFooter from "components/Sections/AppFooter";
import AppHeader from "components/Sections/AppHeader";
import AppSettings from "components/UtilComps/AppSettings";
import { MENU, PATHS } from "libs/config";
import { clearAppSessionsLaunchMode, gtagGo } from "libs/utils";
import MyDataNFTs from "pages/DataNFT/MyDataNFTs";
import { GetNFMeID } from "pages/GetNFMeID";
import MyHome from "pages/Home/MyHome";
import LandingPage from "pages/LandingPage";
import MyLiveliness from "pages/Liveliness/MyLiveliness";
import { TradeData } from "../AdvertiseData/TradeData";

function App({ onShowConnectWalletModal }: { onShowConnectWalletModal: any }) {
  const [, setMenuItem] = useState(MENU.LANDING);
  const [rfKeys] = useState({
    tools: 0,
    sellData: 0,
    buyData: 0,
    auth: 0,
    dataNFTWallet: 0,
  });
  const { pathname } = useLocation();
  let path = pathname?.split("/")[pathname?.split("/")?.length - 1]; // handling Route Path
  const { connected: isSolLoggedIn, disconnect: disconnectSolWallet } = useWallet();
  const [triggerBiTzPlayModelAndIsOpen, setTriggerBiTzPlayModelAndIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (path) {
      path = path.split("-")[0];
      setMenuItem(PATHS[path as keyof typeof PATHS]?.[0] as number);
    }
  }, []);

  const handleLogout = async () => {
    clearAppSessionsLaunchMode();
    gtagGo("auth", "logout", "el");

    // if we are connected to solana
    if (isSolLoggedIn) {
      onShowConnectWalletModal("no-auth");
      await disconnectSolWallet();

      // do a hard reload instead of a simple SPA redirect so we clear the state of app
      window.location.replace("/");
    }
  };

  const handleRemoteTriggerOfBiTzPlayModel = (openItIfNotOpen: boolean) => {
    if (openItIfNotOpen && !triggerBiTzPlayModelAndIsOpen) {
      setTriggerBiTzPlayModelAndIsOpen(true);
    } else {
      setTriggerBiTzPlayModelAndIsOpen(false);
    }
  };

  function commonRoutes() {
    return (
      <>
        <Route
          path="/"
          element={
            <LandingPage
              onShowConnectWalletModal={onShowConnectWalletModal}
              handleLogout={handleLogout}
              onRemoteTriggerOfBiTzPlayModel={handleRemoteTriggerOfBiTzPlayModel}
            />
          }
        />
        <Route path="NFMeID" element={<Outlet />}>
          <Route path="" element={<GetNFMeID onShowConnectWalletModal={onShowConnectWalletModal} />} />
        </Route>
        <Route
          path="dashboard"
          element={
            <MyHome
              key={rfKeys.tools}
              setMenuItem={setMenuItem}
              onShowConnectWalletModal={onShowConnectWalletModal}
              handleLogout={handleLogout}
              onRemoteTriggerOfBiTzPlayModel={handleRemoteTriggerOfBiTzPlayModel}
            />
          }
        />
        <Route path="mintdata" element={<TradeData />} />
        <Route path="datanfts" element={<Outlet />}>
          <Route path="wallet" element={<MyDataNFTs tabState={1} />} />
          <Route path="unbonded" element={<MyDataNFTs tabState={2} />} />
        </Route>

        <Route path="liveliness" element={<MyLiveliness />} />

        <Route path="settings" element={<AppSettings />} />
      </>
    );
  }

  return (
    <>
      {/* App Header */}
      <AppHeader
        onShowConnectWalletModal={onShowConnectWalletModal}
        setMenuItem={setMenuItem}
        handleLogout={handleLogout}
        onRemoteTriggerOfBiTzPlayModel={handleRemoteTriggerOfBiTzPlayModel}
        triggerBiTzPlayModel={triggerBiTzPlayModelAndIsOpen}
      />

      {/* App Body */}
      {isSolLoggedIn ? (
        <Box flexGrow={1} minH={{ base: "auto", lg: "100vh" }}>
          <Routes>{commonRoutes()}</Routes>
        </Box>
      ) : (
        <Box flexGrow={1} minH={{ base: "auto", lg: "100vh" }}>
          <Routes>{commonRoutes()}</Routes>
        </Box>
      )}

      <AppFooter />
    </>
  );
}

export default App;
