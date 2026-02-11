/*** 
 * Initialize redux store, routes, configs
 * @format
 */

import * as React from 'react';
import '@app/utils/log'
import { LogBox, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import '@app/language/i18n'; // ✅ Initialize i18n first
import { checkAndUpdateDeviceLanguage } from '@app/language/i18n'; // ✅ Import language checker

import ErrorBoundary from './components/ErrorBoundary';

// Load language debug utilities in development
if (__DEV__) {
  import('@app/utils/language-debug');
}

import { Navigator } from '@app/navigator';
import { store, persistor } from '@app/redux';
import { Colors } from './styles';
import SplashScreen from 'react-native-splash-screen';
import { webrtcService } from './service/webrtc-service';
import { NavigationService } from './helpers/navigation-service';
import { Linking } from 'react-native';
import { UpdateModal } from '@app/components';
import { useAppUpdate } from '@app/hooks/useAppUpdate';

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications


function MainAppContent() {
  // Check for app updates
  const { updateInfo, showModal, handleUpdate, handleDismiss } = useAppUpdate();

  React.useEffect(() => {
    SplashScreen.hide(); // Hide the splash screen after the component mounts
    // Initialize WebRTC service - will be initialized when first used
    webrtcService.init();

    // Check device language on app start
    checkAndUpdateDeviceLanguage();

    // Listen for app state changes (when app comes to foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, check if device language changed
        checkAndUpdateDeviceLanguage();
      }
    });

    // Deep link fallback handler
    const handleUrl = async (url?: string | null) => {
      if (!url) return;
      try {
        const lower = url.toLowerCase();
        console.log('🔗 Deep link received:', url);
        console.log('🔗 Deep link lowercase:', lower);

        // Profile Screen - supports both schemes
        // gofrts://open/profile or gofrts://open/profilescreen
        if (lower.includes('/profile')) {
          setTimeout(() => {
            try {
              if (!NavigationService.isNavigationReady()) {
                console.warn('🔗 Navigation not ready, retrying...');
                setTimeout(() => handleUrl(url), 500);
                return;
              }
              console.log('🔗 Navigating to ProfileScreen with deepLink param');
              NavigationService.navigate('CustomDrawer', {
                screen: 'BottomTab',
                params: {
                  screen: 'ProfileScreen',
                  params: {
                    deepLink: 'profilescreen',
                    timestamp: Date.now() // Force refresh
                  }
                },
              });
            } catch (error) {
              console.error('🔗 Error navigating to ProfileScreen:', error);
            }
          }, 300);
        }

        // Create Job Screen
        // gofrts://open/createjob or gofrts://open/createjobscreen
        else if (lower.includes('/createjob')) {
          setTimeout(() => {
            try {
              if (!NavigationService.isNavigationReady()) {
                console.warn('🔗 Navigation not ready, retrying...');
                setTimeout(() => handleUrl(url), 500);
                return;
              }
              NavigationService.navigate('CreateJobScreen', {
                paymentSuccess: true,
                deepLink: 'createjob',
                timestamp: Date.now()
              });
            } catch (error) {
              console.error('🔗 Error navigating to CreateJobScreen:', error);
            }
          }, 300);
        }

        // Job Details Screen with jobId
        // gofrts://open/job/123 or gofrts://open/jobdetails/123
        else if (lower.includes('/job')) {
          // Match patterns like: /job/123, /jobdetails/123, /jobdetailsscreen/123
          const jobIdMatch = url.match(/\/job(?:details?screen?)?\/(\d+)/i);
          const jobId = jobIdMatch ? jobIdMatch[1] : null;

          console.log('🔗 Extracted jobId:', jobId, 'from URL:', url);

          if (jobId) {
            setTimeout(() => {
              try {
                if (!NavigationService.isNavigationReady()) {
                  console.warn('🔗 Navigation not ready, retrying...');
                  setTimeout(() => handleUrl(url), 500);
                  return;
                }
                console.log('🔗 Navigating to JobDetailsScreen with jobId:', jobId);
                NavigationService.navigate('JobDetailsScreen', {
                  jobId: Number.parseInt(jobId, 10),
                  paymentSuccess: true,
                  deepLink: 'jobpayment',
                  timestamp: Date.now()
                });
              } catch (error) {
                console.error('🔗 Error navigating to JobDetailsScreen:', error);
              }
            }, 300);
          } else {
            console.warn('🔗 Job URL found but no jobId extracted from:', url);
          }
        }
      } catch (error) {
        console.error('🔗 Error handling deep link:', error);
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => { });
    const linkingSub = Linking.addEventListener('url', (e) => handleUrl(e.url));

    // Cleanup function
    return () => {
      linkingSub.remove();
      subscription.remove();
    };
  }, []);

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Navigator />
      </SafeAreaView>

      {/* App Update Modal */}
      <UpdateModal
        visible={showModal}
        onClose={handleDismiss}
        onUpdate={handleUpdate}
        latestVersion={updateInfo?.latestVersion}
        currentVersion={updateInfo?.currentVersion}
        forceUpdate={updateInfo?.forceUpdate}
        releaseNotes={updateInfo?.releaseNotes}
      />
    </>
  );
}

function MainApp() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <ErrorBoundary>
            <MainAppContent />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

export { MainApp };
