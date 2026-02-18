/// <reference types="@capacitor/local-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bishopministry.congregationmanager',
  appName: 'FH5 Members',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#1a5f7a',
    },
  },
};

export default config;
