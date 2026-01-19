import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastaccounting.app',
  appName: 'FastAccounting',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for development to use local server
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
