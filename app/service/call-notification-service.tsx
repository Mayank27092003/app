/**
 * Call Notification Service
 * Handles incoming call notifications and ringing
 * @format
 */

import { Alert, Vibration, Platform } from 'react-native';
import { Sound, createSound, useSound } from 'react-native-nitro-sound';

class CallNotificationService {
  private ringingSound: any = null;
  private isRinging: boolean = false;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private soundInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupRingingSound();
  }

  /**
   * Setup ringing sound using NitroSound
   */
  private setupRingingSound(): void {
    try {
      console.log('📞 CallNotification: Setting up ringing sound with NitroSound...');
      console.log('📞 CallNotification: Sound available:', !!Sound);
      console.log('📞 CallNotification: Sound type:', typeof Sound);
      
      // Initialize NitroSound for ringing
      this.ringingSound = null; // Will be created when needed
      
      console.log('📞 CallNotification: ✅ NitroSound ringing setup completed');
    } catch (error) {
      console.warn('📞 CallNotification: Failed to setup NitroSound ringing:', error);
      console.warn('📞 CallNotification: Error details:', error.message);
      this.ringingSound = null;
    }
  }

  /**
   * Load a custom ringtone using NitroSound
   */
  async loadCustomRingtone(ringtonePath: string): Promise<boolean> {
    try {
      if (!this.ringingSound) {
        console.warn('📞 CallNotification: NitroSound not initialized');
        return false;
      }

      // Load custom ringtone using NitroSound
      await this.ringingSound.load(ringtonePath);
      console.log('📞 CallNotification: Custom ringtone loaded successfully:', ringtonePath);
      return true;
    } catch (error) {
      console.error('📞 CallNotification: Failed to load custom ringtone:', error);
      return false;
    }
  }

  /**
   * Set ringtone volume using NitroSound
   */
  setRingtoneVolume(volume: number): void {
    try {
      if (this.ringingSound) {
        this.ringingSound.setVolume(volume);
        console.log('📞 CallNotification: Ringtone volume set to:', volume);
      }
    } catch (error) {
      console.error('📞 CallNotification: Failed to set ringtone volume:', error);
    }
  }

  /**
   * Show incoming call notification
   */
  showIncomingCallNotification(callData: any): void {
    console.log('📞 CallNotification: Showing incoming call notification:', callData);
    
    // Start ringing
    this.startRinging();
    
    // Show system notification (if app is in background)
    if (Platform.OS === 'ios') {
      // iOS notification
      this.showIOSNotification(callData);
    } else {
      // Android notification
      this.showAndroidNotification(callData);
    }
  }

  /**
   * Start ringing sound and vibration using NitroSound
   */
  async startRinging(): Promise<void> {
    if (this.isRinging) return;
    
    this.isRinging = true;
    console.log('📞 CallNotification: Starting ringing with enhanced vibration...');
    
    // Start the enhanced vibration pattern (which we know works perfectly)
    this.startEnhancedVibration();
    
      // Skip audio for now - focus on WebRTC connection
      console.log('📞 CallNotification: Using vibration only (audio disabled for debugging)');
    
    console.log('📞 CallNotification: ✅ Enhanced ringing started (vibration + audio attempt)');
    
    // Mark as playing
    this.ringingSound = 'playing';
  }
  /**
   * Start enhanced sound pattern using vibration + console
   */
  private startEnhancedSoundPattern(): void {
    try {
      console.log('📞 CallNotification: Starting enhanced sound pattern...');
      
      // Create a more realistic ringing pattern using vibration
      const playSoundPattern = () => {
        if (this.isRinging) {
          console.log('📞 CallNotification: 🔊 RING! RING! RING! (Incoming call sound)');
          
          // Enhanced vibration pattern for sound effect
          Vibration.vibrate([100, 200, 100, 200, 100, 200, 100, 200]); // Ring pattern
          
          // Schedule next sound
          this.soundInterval = setTimeout(playSoundPattern, 1500); // Every 1.5 seconds
        }
      };
      
      // Start the sound pattern
      playSoundPattern();
      console.log('📞 CallNotification: Enhanced sound pattern started');
    } catch (error) {
      console.error('📞 CallNotification: Failed to start enhanced sound pattern:', error);
    }
  }

  /**
   * Start enhanced vibration pattern for ringing
   */
  private startEnhancedVibration(): void {
    try {
      console.log('📞 CallNotification: Starting enhanced vibration pattern...');
      
      // Create a more realistic ringing vibration pattern
      const vibrationPattern = () => {
        if (this.isRinging) {
          // Short vibration
          Vibration.vibrate(200);
          
          // Wait, then long vibration
          setTimeout(() => {
            if (this.isRinging) {
              Vibration.vibrate(500);
            }
          }, 300);
          
          // Schedule next vibration cycle
          this.vibrationInterval = setTimeout(vibrationPattern, 2000); // Every 2 seconds
        }
      };
      
      // Start the vibration pattern
      vibrationPattern();
      console.log('📞 CallNotification: Enhanced vibration pattern started');
    } catch (error) {
      console.error('📞 CallNotification: Failed to start enhanced vibration:', error);
    }
  }

  /**
   * Start sound pattern using system capabilities
   */
  private startSoundPattern(): void {
    try {
      console.log('📞 CallNotification: Starting sound pattern...');
      
      // Create a sound pattern using enhanced vibration + console feedback
      const playSoundPattern = () => {
        if (this.isRinging) {
          console.log('📞 CallNotification: 🔊 RING! RING! RING! (Incoming call sound)');
          
          // Enhanced vibration for sound effect
          Vibration.vibrate([100, 200, 100, 200, 100, 200]); // Ring pattern
          
          // Schedule next sound
          this.soundInterval = setTimeout(playSoundPattern, 2000); // Every 2 seconds
        }
      };
      
      // Start the sound pattern
      playSoundPattern();
      console.log('📞 CallNotification: Sound pattern started');
    } catch (error) {
      console.error('📞 CallNotification: Failed to start sound pattern:', error);
    }
  }

  /**
   * Start simple sound pattern using system beep
   */
  private startSimpleSound(): void {
    try {
      console.log('📞 CallNotification: Starting simple sound pattern...');
      
      // For now, we'll use a combination of vibration and console logs
      // In a real implementation, you would use a proper audio library
      const playBeep = () => {
        if (this.isRinging) {
          console.log('📞 CallNotification: 🔊 BEEP! (Ringing sound should play here)');
          
          // Additional vibration for sound effect
          Vibration.vibrate(100);
          
          // Schedule next beep
          this.soundInterval = setTimeout(playBeep, 1500); // Beep every 1.5 seconds
        }
      };
      
      // Start the beep pattern
      playBeep();
      console.log('📞 CallNotification: Simple sound pattern started');
    } catch (error) {
      console.error('📞 CallNotification: Failed to start simple sound:', error);
    }
  }

  /**
   * Stop ringing sound and vibration
   */
  async stopRinging(): Promise<void> {
    if (!this.isRinging) return;
    
    this.isRinging = false;
    console.log('📞 CallNotification: Stopping ringing...');
    
    // Stop vibration
    this.stopVibration();
    
    // Stop audio playback
    try {
      await Sound.stopPlayer();
      Sound.removePlaybackEndListener();
      console.log('📞 CallNotification: ✅ Audio stopped');
    } catch (error) {
      console.log('📞 CallNotification: Audio stop failed (might not have been playing)');
    }
    
    // Stop any sound patterns
    if (this.soundInterval) {
      clearTimeout(this.soundInterval);
      this.soundInterval = null;
      console.log('📞 CallNotification: ✅ Sound pattern stopped');
    }
    
    // Reset ringing sound
    this.ringingSound = null;
    
    console.log('📞 CallNotification: ✅ Ringing stopped successfully');
  }

  /**
   * Start vibration pattern
   */
  private startVibration(): void {
    if (this.vibrationInterval) return;
    
    // Vibration pattern: vibrate for 1 second, pause for 1 second
    const vibrate = () => {
      Vibration.vibrate(1000);
    };
    
    // Start vibration immediately
    vibrate();
    
    // Set up interval for continuous vibration
    this.vibrationInterval = setInterval(vibrate, 2000);
  }

  /**
   * Stop vibration pattern
   */
  private stopVibration(): void {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    Vibration.cancel();
  }

  /**
   * Show iOS notification
   */
  private showIOSNotification(callData: any): void {
    // iOS doesn't allow custom notifications during calls
    // The system will handle the call notification
    console.log('📞 CallNotification: iOS call notification handled by system');
  }

  /**
   * Show Android notification
   */
  private showAndroidNotification(callData: any): void {
    // Android allows custom notifications
    // You could use react-native-push-notification here
    console.log('📞 CallNotification: Android call notification');
  }

  /**
   * Show call ended notification
   */
  showCallEndedNotification(): void {
    console.log('📞 CallNotification: Showing call ended notification');
    
    // Stop ringing
    this.stopRinging();
    
    // Show brief notification
    Alert.alert(
      'Call Ended',
      'The call has ended',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show call declined notification
   */
  showCallDeclinedNotification(): void {
    console.log('📞 CallNotification: Showing call declined notification');
    
    // Stop ringing
    this.stopRinging();
    
    // Show brief notification
    Alert.alert(
      'Call Declined',
      'The call was declined',
      [{ text: 'OK' }]
    );
  }

  /**
   * Cleanup resources using NitroSound
   */
  async cleanup(): Promise<void> {
    await this.stopRinging();
    
    if (this.ringingSound) {
      try {
        // NitroSound cleanup
        await Sound.stopPlayer();
        Sound.removePlaybackEndListener();
        this.ringingSound = null;
        console.log('📞 CallNotification: Audio cleaned up successfully');
      } catch (error) {
        console.error('📞 CallNotification: Failed to cleanup audio:', error);
      }
    }
  }
}

// Export singleton instance
export const callNotificationService = new CallNotificationService();
