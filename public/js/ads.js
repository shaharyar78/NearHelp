const APP_OPEN_AD_ID = "ca-app-pub-4282282216399668/7333540931";
const BANNER_AD_ID = "ca-app-pub-4282282216399668/3926532981";
const APP_OPEN_SHOWN_KEY = "nearhelp_app_open_shown";
const BANNER_STARTED_KEY = "nearhelp_banner_started";
const ADS_SETUP_STARTED_KEY = "nearhelp_admob_setup_started";
const BANNER_HEIGHT_KEY = "nearhelp_banner_height";
let bannerListenerAttached = false;
const capacitor = window.Capacitor;
const AdMob = capacitor?.Plugins?.AdMob;

if (capacitor?.isNativePlatform?.() && AdMob) {
  void attachBannerSizeListener();

  if (sessionStorage.getItem(BANNER_STARTED_KEY) !== "true") {
    if (sessionStorage.getItem(ADS_SETUP_STARTED_KEY) === "true") {
      if (sessionStorage.getItem(APP_OPEN_SHOWN_KEY) === "true") {
        void startBanner();
      }
    } else {
      sessionStorage.setItem(ADS_SETUP_STARTED_KEY, "true");
      void startAds();
    }
  }
}

async function attachBannerSizeListener() {
  if (bannerListenerAttached) return;
  bannerListenerAttached = true;

  try {
    await AdMob.addListener("bannerAdSizeChanged", ({ height }) => {
      const bannerHeight = Math.max(0, Number(height) || 0);
      sessionStorage.setItem(BANNER_HEIGHT_KEY, String(bannerHeight));
      document.body.style.paddingBottom = bannerHeight > 0 ? `${bannerHeight}px` : "";
    });

    if (sessionStorage.getItem(BANNER_STARTED_KEY) === "true") {
      const bannerHeight = Number(sessionStorage.getItem(BANNER_HEIGHT_KEY)) || 0;
      document.body.style.paddingBottom = bannerHeight > 0 ? `${bannerHeight}px` : "";
    }
  } catch (error) {
    bannerListenerAttached = false;
    console.warn("NearHelp banner size listener could not be added.", error);
  }
}

if (capacitor?.isNativePlatform?.() && !AdMob) {
  console.error("NearHelp AdMob plugin is not registered in this APK. Sync and rebuild the Android project.");
}

async function startBanner() {
  if (sessionStorage.getItem(BANNER_STARTED_KEY) === "true") return;

  try {
    await attachBannerSizeListener();
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      margin: 0,
    });
    sessionStorage.setItem(BANNER_STARTED_KEY, "true");
  } catch (error) {
    console.warn("NearHelp banner ad could not be shown.", error);
  }
}

async function startAds() {
  let canRequestAds = false;

  try {
    let consent = await AdMob.requestConsentInfo();
    if (
      consent.isConsentFormAvailable &&
      consent.status === "REQUIRED"
    ) {
      consent = await AdMob.showConsentForm();
    }

    if (!consent.canRequestAds) return;
    canRequestAds = true;

    await AdMob.initialize();

    if (sessionStorage.getItem(APP_OPEN_SHOWN_KEY) !== "true") {
      await AdMob.addListener("appOpenAdClosed", () => {
        void startBanner();
      });
      await AdMob.addListener("appOpenAdFailedToShow", () => {
        void startBanner();
      });

      sessionStorage.setItem(APP_OPEN_SHOWN_KEY, "true");
      const { adUnitId } = await AdMob.loadAppOpen({ adId: APP_OPEN_AD_ID });
      const { value: isLoaded } = await AdMob.isAppOpenLoaded({ adId: adUnitId });

      if (isLoaded) {
        await AdMob.showAppOpen({ adId: adUnitId });
        return;
      }
    }

    await startBanner();
  } catch (error) {
    console.warn("NearHelp ads could not be initialized.", error);
    if (canRequestAds) await startBanner();
  }
}
