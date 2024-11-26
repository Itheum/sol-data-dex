import React from "react";
import Dashboard from "../../components/Dashboard";

export default function MyHome({
  onShowConnectWalletModal,
  handleLogout,
  onRemoteTriggerOfBiTzPlayModel,
}: {
  setMenuItem: any;
  onShowConnectWalletModal?: any;
  handleLogout: any;
  onRemoteTriggerOfBiTzPlayModel?: any;
}) {
  return (
    <Dashboard
      onShowConnectWalletModal={onShowConnectWalletModal}
      handleLogout={handleLogout}
      onRemoteTriggerOfBiTzPlayModel={onRemoteTriggerOfBiTzPlayModel}
    />
  );
}
