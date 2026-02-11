/**
 * App loader
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useSelector } from 'react-redux';

import { selectLoader } from '@app/module/common';
import { getStyles } from './styles';

const Loader = () => {
  const styles = getStyles();
  const visible = useSelector(selectLoader);
  const [allowLoader, setAllowLoader] = useState(false);

  // Completely disable global loader for now to prevent conflicts with skeleton loaders
  useEffect(() => {
    // Set a very long delay to effectively disable the global loader
    const timer = setTimeout(() => {
      setAllowLoader(true);
    }, 60000); // Allow loader after 60 seconds (effectively disabled)

    return () => clearTimeout(timer);
  }, []);

  console.log('Loader component - visible:', visible, 'allowLoader:', allowLoader);

  // Don't show loader during initial app load and skeleton loading
  if (!visible || !allowLoader) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.loaderContent}> */}
        <ActivityIndicator size="large" color="#E67932" />
        <Text style={styles.loadingText}>Loading...</Text>
      {/* </View> */}
    </View>
  );
};

export { Loader };
