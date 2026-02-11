/**
 * Navigation Service - FIXED FOR PHYSICAL DEVICE
 * @format
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import { CommonActions, StackActions } from '@react-navigation/native';

// Use the proper React Navigation ref API
export const navigationRef = createNavigationContainerRef();

// Simple boolean flag instead of ref
let _isNavigationReady = false;

/**
 * Set navigation ready state
 */
export function setNavigationReady(ready: boolean) {
  _isNavigationReady = ready;
  console.log('🧭 Navigation ready state set to:', ready);
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady() {
  return _isNavigationReady && navigationRef.isReady();
}

/**
 * Navigate to a route
 */
export function navigate(name: string, params?: any) {
  console.log('🧭 Navigate called:', { name, params, ready: isNavigationReady() });

  if (!isNavigationReady()) {
    console.warn('⚠️ Navigation not ready, queuing navigation...');
    // Queue the navigation
    setTimeout(() => {
      if (isNavigationReady()) {
        navigate(name, params);
      } else {
        console.error('❌ Navigation still not ready after timeout');
      }
    }, 300);
    return;
  }

  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name as never, params as never);
      console.log('✅ Navigation successful');
    }
  } catch (error) {
    console.error('❌ Navigation error:', error);
  }
}

/**
 * Go back
 */
export function goBack() {
  if (!isNavigationReady()) {
    console.warn('⚠️ Cannot go back, navigation not ready');
    return;
  }

  try {
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  } catch (error) {
    console.error('❌ Go back error:', error);
  }
}

/**
 * Replace current screen
 */
export function replace(name: string, params?: any) {
  if (!isNavigationReady()) {
    console.warn('⚠️ Cannot replace, navigation not ready');
    return;
  }

  try {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(name, params));
    }
  } catch (error) {
    console.error('❌ Replace error:', error);
  }
}

/**
 * Get current route name
 */
export function getCurrentRouteName() {
  if (!isNavigationReady()) {
    return null;
  }

  try {
    return navigationRef.getCurrentRoute()?.name;
  } catch (error) {
    console.error('❌ Get route name error:', error);
    return null;
  }
}

// Export as default object
export const NavigationService = {
  navigationRef,
  navigate,
  goBack,
  replace,
  setNavigationReady,
  isNavigationReady,
  getCurrentRouteName,
};
