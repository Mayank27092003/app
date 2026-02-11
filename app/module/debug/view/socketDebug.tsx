/**
 * Socket Debug Screen
 * @format
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { RefreshCw, Wifi, WifiOff, Activity, CheckCircle, XCircle } from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./socketDebugStyles";
import Header from "@app/components/Header";
import { socketService } from "@app/service/socket-service";

interface ConnectionInfo {
  connected: boolean;
  id: string | null;
  transport: string | null;
  url: string | null;
  error: string | null;
}

function SocketDebugScreen({ navigation }) {
  const styles = useThemedStyle(getStyles);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    updateConnectionInfo();
    
    // Add initial log
    addLog("Socket Debug Screen loaded");
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 9)]); // Keep last 10 logs
    console.log(logMessage);
  };

  const updateConnectionInfo = () => {
    const info = socketService.getConnectionInfo();
    setConnectionInfo(info);
    addLog(`Connection info updated - Connected: ${info.connected}`);
  };

  const reconnectSocket = () => {
    addLog("Attempting to reconnect socket...");
    socketService.disconnect();
    setTimeout(() => {
      socketService.connect();
      setTimeout(() => {
        updateConnectionInfo();
        addLog("Reconnection attempt completed");
      }, 2000);
    }, 1000);
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? Colors.success : Colors.error;
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? CheckCircle : XCircle;
  };

  return (
    <View style={styles.container}>
      <Header title="Socket Debug" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          
          {connectionInfo && (
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                {React.createElement(getStatusIcon(connectionInfo.connected), {
                  size: 24,
                  color: getStatusColor(connectionInfo.connected)
                })}
                <Text style={[styles.statusText, { color: getStatusColor(connectionInfo.connected) }]}>
                  {connectionInfo.connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Socket ID:</Text>
                <Text style={styles.infoValue}>{connectionInfo.id || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transport:</Text>
                <Text style={styles.infoValue}>{connectionInfo.transport || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>URL:</Text>
                <Text style={styles.infoValue}>{connectionInfo.url || 'N/A'}</Text>
              </View>

              {connectionInfo.error && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Error:</Text>
                  <Text style={[styles.infoValue, { color: Colors.error }]}>{connectionInfo.error}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={reconnectSocket}
          >
            <RefreshCw size={20} color={Colors.white} />
            <Text style={styles.buttonText}>Reconnect Socket</Text>
          </TouchableOpacity>
        </View>

        {/* Live Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Logs</Text>
          <View style={styles.logContainer}>
            {logs.length === 0 ? (
              <Text style={styles.logEntry}>No logs yet...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>{log}</Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default SocketDebugScreen;