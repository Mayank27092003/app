import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_KEY = 'hasSeenIntro';

export const hasSeenIntro = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(INTRO_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking intro status:', error);
    return false;
  }
};

export const markIntroAsSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(INTRO_KEY, 'true');
  } catch (error) {
    console.error('Error saving intro status:', error);
  }
};

export const resetIntroStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(INTRO_KEY);
  } catch (error) {
    console.error('Error resetting intro status:', error);
  }
};
