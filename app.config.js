// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: "jmac-cleaning-services",
    slug: "jmac-cleaning-services",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    web: {
       favicon: "./assets/images/icon.png" 
      },
    scheme: "jmac-cleaning-services",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      adminId: process.env.ADMIN_ID
    }
  }
};
