import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import NotificationService from '@app/service/notification-service';
import { initializeSocket } from '@app/service';
import { initializeDynamicTranslations } from '@app/language/i18n';
import '@app/utils/socket-test'; // Import socket test utilities

const AppBootstrapGate = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing services...');
        
        // Initialize translations from backend
        await initializeDynamicTranslations();
        console.log('Translations initialized successfully');
        
        // Initialize notifications
        await NotificationService.initialize();
        console.log('Notification service initialized successfully');
        
        // Initialize socket connection
        initializeSocket();
        console.log('Socket service initialized');
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    // Initialize services after a short delay to ensure app is ready
    const timer = setTimeout(() => {
      initializeServices();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
};

export { AppBootstrapGate };