import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Payment, PaymentStatus, Transaction } from "@app/types";
import { mockPaymentMethods, mockTransactions } from "../mocks/payments";
import { paymentService, BankAccount, AddBankAccountRequest } from "../service/payment-service";
type PaymentMethod = {
  id: string;
  type: string;
  brand?: string;
  last4: string;
  expMonth?: string;
  expYear?: string;
  bankName?: string;
  accountType?: string;
  isDefault: boolean;
};

type PaymentState = {
  balance: number;
  pendingBalance: number;
  currency: string;
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  isLoading: boolean;
  bankAccountsLoading: boolean;
  error: string | null;

  // Actions
  fetchWalletBalance: () => Promise<void>;
  fetchBankAccounts: (userId: string | number) => Promise<void>;
  addBankAccount: (accountData: AddBankAccountRequest) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (methodId: string) => void;
  setDefaultPaymentMethod: (methodId: string) => void;
  processPayment: (paymentData: {
    amount: number;
    currency: string;
    jobId: string;
    payerId: string;
    payeeId: string;
    description: string;
    jobReference?: string;
  }) => Transaction | null;
  withdrawFunds: (
    amount: number,
    paymentMethodId: string
  ) => Transaction | null;
  depositFunds: (amount: number, paymentMethodId: string) => Transaction | null;
  getTransactionById: (transactionId: string) => Transaction | undefined;
};

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      balance: 0,
      pendingBalance: 0,
      currency: "USD",
      paymentMethods: [...mockPaymentMethods],
      bankAccounts: [],
      transactions: [...mockTransactions],
      isLoading: false,
      bankAccountsLoading: false,
      error: null,

      fetchWalletBalance: async () => {
        set({ isLoading: true, error: null });

        try {
          const walletData = await paymentService.getWalletBalance();

          set({
            balance: walletData.balance,
            pendingBalance: walletData.pendingBalance,
            currency: (walletData.currency || 'USD').toUpperCase(),
            isLoading: false,
            error: null,
          });

          console.log('💰 PaymentStore: Wallet balance updated:', walletData);
        } catch (error) {
          console.error('💰 PaymentStore: Error fetching wallet balance:', error);

          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch wallet balance',
          });
        }
      },

      fetchBankAccounts: async (userId: string | number) => {
        console.log('🏦 PaymentStore: fetchBankAccounts called! for user', userId);
        set({ bankAccountsLoading: true, error: null });

        try {
          console.log('🏦 PaymentStore: Starting to fetch bank accounts...');
          const bankAccounts = await paymentService.getBankAccounts(userId);

          set({
            bankAccounts,
            bankAccountsLoading: false,
            error: null,
          });

          console.log('🏦 PaymentStore: Bank accounts updated in store:', bankAccounts);
        } catch (error) {
          console.error('🏦 PaymentStore: Error fetching bank accounts:', error);

          set({
            bankAccountsLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch bank accounts',
          });
        }
      },

      addBankAccount: async (accountData: AddBankAccountRequest) => {
        try {
          console.log('🏦 PaymentStore: Adding bank account:', accountData);

          const newAccount = await paymentService.addBankAccount(accountData);

          // Add the new account to the local state
          set((state) => ({
            bankAccounts: [...state.bankAccounts, newAccount],
          }));

          console.log('🏦 PaymentStore: Bank account added successfully:', newAccount);
        } catch (error) {
          console.error('🏦 PaymentStore: Error adding bank account:', error);
          throw error;
        }
      },

      deleteBankAccount: async (accountId: string) => {
        try {
          console.log('🏦 PaymentStore: Deleting bank account:', accountId);

          await paymentService.deleteBankAccount(accountId);

          // Remove the account from the local state using externalBankId
          set((state) => ({
            bankAccounts: state.bankAccounts.filter(account => account.externalBankId !== accountId),
          }));

          console.log('🏦 PaymentStore: Bank account deleted successfully');
        } catch (error) {
          console.error('🏦 PaymentStore: Error deleting bank account:', error);
          throw error;
        }
      },

      addPaymentMethod: (method: PaymentMethod) => {
        set((state) => {
          // If this is the first payment method or it's marked as default
          if (state.paymentMethods.length === 0 || method.isDefault) {
            // Set all other methods to non-default
            const updatedMethods = state.paymentMethods.map((m) => ({
              ...m,
              isDefault: false,
            }));

            return {
              paymentMethods: [...updatedMethods, method],
            };
          }

          return {
            paymentMethods: [...state.paymentMethods, method],
          };
        });
      },

      removePaymentMethod: (methodId: string) => {
        set((state) => {
          // Check if the method to remove is the default
          const methodToRemove = state.paymentMethods.find(
            (m) => m.id === methodId
          );

          if (!methodToRemove) {
            return state;
          }

          const updatedMethods = state.paymentMethods.filter(
            (m) => m.id !== methodId
          );

          // If the removed method was the default and there are other methods,
          // set the first one as default
          if (methodToRemove.isDefault && updatedMethods.length > 0) {
            updatedMethods[0].isDefault = true;
          }

          return {
            paymentMethods: updatedMethods,
          };
        });
      },

      setDefaultPaymentMethod: (methodId: string) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((method) => ({
            ...method,
            isDefault: method.id === methodId,
          })),
        }));
      },

      processPayment: (paymentData) => {
        const { balance } = get();

        // Check if payer has enough balance
        if (balance < paymentData.amount) {
          return null;
        }

        // Calculate platform fee (5%)
        const fee = paymentData.amount * 0.05;

        // Create transaction
        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          type: "payment",
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: "completed",
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          description: paymentData.description,
          payerId: paymentData.payerId,
          payeeId: paymentData.payeeId,
          fee,
          jobId: paymentData.jobId,
          jobReference: paymentData.jobReference,
          paymentMethod: "Balance",
        };

        // Update state
        set((state) => ({
          balance: state.balance - paymentData.amount,
          transactions: [transaction, ...state.transactions],
        }));

        return transaction;
      },

      withdrawFunds: (amount, paymentMethodId) => {
        const { balance, paymentMethods } = get();

        // Check if user has enough balance
        if (balance < amount) {
          return null;
        }

        // Find payment method
        const paymentMethod = paymentMethods.find(
          (m) => m.id === paymentMethodId
        );

        if (!paymentMethod) {
          return null;
        }

        // Create transaction
        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          type: "withdrawal",
          amount,
          currency: "USD",
          status: "pending",
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          description: `Withdrawal to ${paymentMethod.type === "bank"
            ? `${paymentMethod.bankName} ****${paymentMethod.last4}`
            : `${paymentMethod.brand} ****${paymentMethod.last4}`
            }`,
          payerId: "system",
          payeeId: "user",
          fee: 0,
          paymentMethod:
            paymentMethod.type === "bank"
              ? `${paymentMethod.bankName} ****${paymentMethod.last4}`
              : `${paymentMethod.brand} ****${paymentMethod.last4}`,
        };

        // Update state
        set((state) => ({
          balance: state.balance - amount,
          pendingBalance: state.pendingBalance + amount,
          transactions: [transaction, ...state.transactions],
        }));

        return transaction;
      },

      depositFunds: (amount, paymentMethodId) => {
        const { paymentMethods } = get();

        // Find payment method
        const paymentMethod = paymentMethods.find(
          (m) => m.id === paymentMethodId
        );

        if (!paymentMethod) {
          return null;
        }

        // Create transaction
        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          type: "deposit",
          amount,
          currency: "USD",
          status: "completed",
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          description: `Deposit from ${paymentMethod.type === "bank"
            ? `${paymentMethod.bankName} ****${paymentMethod.last4}`
            : `${paymentMethod.brand} ****${paymentMethod.last4}`
            }`,
          payerId: "user",
          payeeId: "system",
          fee: 0,
          paymentMethod:
            paymentMethod.type === "bank"
              ? `${paymentMethod.bankName} ****${paymentMethod.last4}`
              : `${paymentMethod.brand} ****${paymentMethod.last4}`,
        };

        // Update state
        set((state) => ({
          balance: state.balance + amount,
          transactions: [transaction, ...state.transactions],
        }));

        return transaction;
      },

      getTransactionById: (transactionId) => {
        return get().transactions.find((t) => t.id === transactionId);
      },
    }),
    {
      name: "payment-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
