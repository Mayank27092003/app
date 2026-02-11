import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const FullScreenDocumentViewer = ({ googleDocsUrl, onClose, documentName }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  return (
    <View style={styles.fullScreen}>
      <StatusBar hidden />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {documentName}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* WebView Container */}
      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading document...</Text>
          </View>
        )}
        
        <WebView 
          ref={webViewRef}
          source={{ uri: googleDocsUrl }} 
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
          }}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsFullscreenVideo={true}
        />
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={[styles.controlButton, !canGoBack && styles.disabledButton]}
        >
          <Icon name="arrow-back" size={20} color={canGoBack ? "#fff" : "#666"} />
          <Text style={[styles.controlText, !canGoBack && styles.disabledText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => webViewRef.current?.reload()}
          style={styles.controlButton}
        >
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.controlText}>Reload</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          style={[styles.controlButton, !canGoForward && styles.disabledButton]}
        >
          <Icon name="arrow-forward" size={20} color={canGoForward ? "#fff" : "#666"} />
          <Text style={[styles.controlText, !canGoForward && styles.disabledText]}>
            Forward
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
    height: height,
    width: width,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    paddingTop: 40, // for status bar area
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40, // for balance
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  disabledText: {
    color: '#666',
  },
});

export default FullScreenDocumentViewer;