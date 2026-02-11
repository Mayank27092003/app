import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BrokerProfile, CarrierProfile, DriverProfile, MerchantProfile, UserRole } from "@app/types";
import { mockDrivers, mockMerchants,mockCarriers,mockBroker} from "@app/mocks/users";

type AuthState = {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  userProfile: DriverProfile | MerchantProfile | CarrierProfile | BrokerProfile | null;
  preferredLanguage: string;
  rememberMe: boolean;

  // Actions
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  setPreferredLanguage: (language: string) => void;
  updateProfile: (profile: Partial<DriverProfile | MerchantProfile | CarrierProfile | BrokerProfile>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userRole: null,
      userId: null,
      userProfile: null,
      preferredLanguage: "en",
      rememberMe: false,

      login: async (email: string, password: string, rememberMe = false) => {
        // Mock authentication - in a real app, this would call an API

        // Find user in mock data
        let foundUser = null;
        let role: UserRole | null = null;

        // Check if user exists in broker
        foundUser = mockBroker.find(
          (broker) => broker.email.toLowerCase() === email.toLowerCase()
        );
        if (foundUser) {
          role = "broker";
        }

        // Check if user exists in carriers
        if (!foundUser) {
          foundUser = mockCarriers.find(
            (carrier) => carrier.email.toLowerCase() === email.toLowerCase()
          );
          if (foundUser) {
            role = "carrier";
          }
        }

        // If not found in carriers, check drivers
        if (!foundUser) {
          foundUser = mockDrivers.find(
            (driver) => driver.email.toLowerCase() === email.toLowerCase()
          );
          if (foundUser) {
            role = "driver";
          }
        }

        // If not found in drivers, check merchants
        if (!foundUser) {
          foundUser = mockMerchants.find(
            (merchant) => merchant.email.toLowerCase() === email.toLowerCase()
          );
          if (foundUser) {
            role = "merchant";
          }
        }

        if (foundUser) {
          set({
            isAuthenticated: true,
            userRole: role,
            userId: foundUser.id,
            userProfile: foundUser,
            rememberMe,
          });
          return true;
        }

        return false;
      },

      logout: () => {
        set((state) => ({
          isAuthenticated: false,
          userRole: null,
          userId: null,
          userProfile: null,
          // Keep the rememberMe preference if user has it enabled
          rememberMe: state.rememberMe,
        }));
      },

      setUserRole: (role: UserRole) => {
        set({ userRole: role });
      },

      setPreferredLanguage: (language: string) => {
        set({ preferredLanguage: language });
      },

      updateProfile: (profile: Partial<DriverProfile | MerchantProfile | CarrierProfile | BrokerProfile>) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...profile }
            : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist if rememberMe is true
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        userId: state.userId,
        userProfile: state.userProfile,
        preferredLanguage: state.preferredLanguage,
        rememberMe: state.rememberMe,
      }),
    }
  )
);
