/**
 * Socket Utilities
 * @format
 */

import { socketService } from '@app/service/socket-service';

/**
 * Check socket status
 */
export const checkSocketStatus = () => {
  const info = socketService.getConnectionInfo();
  console.log('🔍 Socket Status:');
  console.log('  Connected:', info.connected ? '✅' : '❌');
  console.log('  Socket ID:', info.id || 'N/A');
  console.log('  Transport:', info.transport || 'N/A');
  console.log('  URL:', info.url || 'N/A');
  if (info.error) {
    console.log('  Error:', info.error);
  }
  return info;
};

/**
 * Reconnect socket
 */
export const reconnectSocket = () => {
  console.log('🔄 Reconnecting socket...');
  socketService.disconnect();
  
  setTimeout(() => {
    socketService.connect();
    console.log('🔄 Reconnection initiated');
  }, 1000);
};

// Make functions available globally for console testing
if (__DEV__) {
  (global as any).checkSocket = checkSocketStatus;
  (global as any).reconnectSocket = reconnectSocket;
  
  console.log('🔧 Socket utilities available:');
  console.log('  checkSocket() - Check socket status');
  console.log('  reconnectSocket() - Reconnect socket');
}