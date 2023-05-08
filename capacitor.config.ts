import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.sagefuture.fatebook',
  appName: 'Fatebook',
  webDir: 'out',
  bundledWebRuntime: false,

  // // hot reload - dev only
  // server: {
  //   url: "192.168.13.38:3000",
  //   cleartext: true
  // }
}

export default config
