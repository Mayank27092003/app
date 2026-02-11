import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Play, StopCircle } from 'lucide-react-native';
import Sound from 'react-native-nitro-sound';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const AudioPlayer = ({ audioPath }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');

  const progress = useSharedValue(0);

  // Format milliseconds to mm:ss
  const formatTime = (timeInMilliseconds: number) => {
    if (isNaN(timeInMilliseconds) || timeInMilliseconds < 0) {
      return '00:00';
    }
    
    const totalSeconds = timeInMilliseconds / 1000; // Convert ms to seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const onStartPlay = async () => {
    if (!audioPath) return;
    setIsLoading(true);
    try {
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();

      await Sound.startPlayer(audioPath);

      Sound.addPlayBackListener((e) => {
        console.log('Playback event (ms):', e); // Debug log
        
        const currentPos = Number(e.currentPosition) || 0;
        const duration = Number(e.duration) || 0;
        
        setPlayTime(formatTime(currentPos));
        setDuration(formatTime(duration));
        
        progress.value = duration > 0 ? Math.min(currentPos / duration, 1) : 0;
      });

      Sound.addPlaybackEndListener(() => {
        setIsPlaying(false);
        progress.value = 0;
        setPlayTime('00:00');
        Sound.removePlayBackListener();
        Sound.removePlaybackEndListener();
      });

      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start playback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onStopPlay = async () => {
    setIsLoading(true);
    try {
      await Sound.stopPlayer();
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
      setIsPlaying(false);
      progress.value = 0;
      setPlayTime('00:00');
    } catch (error) {
      console.error('Failed to stop playback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  useEffect(() => {
    return () => {
      Sound.stopPlayer();
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.timeText}>{playTime} / {duration}</Text>

      <View style={styles.playerRow}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? onStopPlay : onStartPlay}
          disabled={isLoading || !audioPath}
        >
          {isPlaying ? <StopCircle size={24} color="white" /> : <Play size={24} color="white" />}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, progressStyle]} />
        </View>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 4 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#2e2e2e',
    borderRadius: 16,
    width: 250,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#00ffcc',
  },
});