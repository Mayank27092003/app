/**
 * Hook to check for app updates
 * @format
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { appUpdateService } from '@app/service/app-update-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECK_KEY = '@app_update_last_check';
const DISMISSED_VERSION_KEY = '@app_update_dismissed_version';

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
  updateUrl?: string;
  forceUpdate?: boolean;
  releaseNotes?: string;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useAppUpdate = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdate = useCallback(async (forceCheck = false) => {
    try {
      // Check if we should skip the check (not forced and already checked today)
      if (!forceCheck) {
        const lastCheckDate = await AsyncStorage.getItem(LAST_CHECK_KEY);
        const todayDate = getTodayDate();
        
        if (lastCheckDate === todayDate) {
          console.log('⏭️ Skipping update check - already checked today');
          return;
        }
      }

      setIsChecking(true);
      const result = await appUpdateService.checkForUpdate();
      console.log(result, "result");
      
      // Save today's date as last check date
      const todayDate = getTodayDate();
      await AsyncStorage.setItem(LAST_CHECK_KEY, todayDate);

      if (result.hasUpdate) {
        // Check if user has dismissed this version
        const dismissedVersion = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
        if (dismissedVersion === result.latestVersion && !result.forceUpdate) {
          console.log('⏭️ User dismissed this version, skipping');
          return;
        }
        setUpdateInfo(result);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking for app update:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (updateInfo?.updateUrl) {
      appUpdateService.openStore(updateInfo.updateUrl);
    }
    setShowModal(false);
  }, [updateInfo]);

  const handleDismiss = useCallback(async () => {
    if (updateInfo?.latestVersion && !updateInfo.forceUpdate) {
      // Save dismissed version
      await AsyncStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.latestVersion);
    }
    setShowModal(false);
  }, [updateInfo]);

  // Check for updates on mount (once per day)
  useEffect(() => {
    // Delay initial check to avoid blocking app startup
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Check for updates when app comes to foreground (once per day)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check for updates when app comes to foreground (but not immediately)
        // This ensures we check once per day when user opens the app
        setTimeout(() => {
          checkForUpdate();
        }, 3000); // Wait 3 seconds after app becomes active
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkForUpdate]);

  return {
    updateInfo,
    showModal,
    isChecking,
    checkForUpdate,
    handleUpdate,
    handleDismiss,
  };
};

