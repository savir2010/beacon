import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.beaconmediation.app",
  appName: "Beacon",
  webDir: "dist",
  backgroundColor: "#f4f8fb",
  ios: { contentInset: "never", backgroundColor: "#f4f8fb" },
};

export default config;
