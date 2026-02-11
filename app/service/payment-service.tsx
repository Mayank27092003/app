/**
 * Payment Service
 * Handles payment and wallet related API calls
 * @format
 */

import { httpRequest } from './http-service';
import { endPoints } from './endpoints';

export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  currency: string;
}

export interface AddBankAccountRequest {
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  country: string;
}

export interface BankAccount {
  id: string;
  externalBankId?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  isDefault: boolean;
  isVerified: boolean;
  isActive?: boolean;
  country?: string;
  currency?: string;
  last4?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4: string;
  expMonth?: string;
  expYear?: string;
  bankName?: string;
  accountType?: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'deposit' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  time: string;
  description: string;
  payerId: string;
  payeeId: string;
  fee: number;
  jobId?: string;
  jobReference?: string;
  paymentMethod?: string;
}

class PaymentService {
  /**
   * Test method to verify httpRequest is working
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 PaymentService: Testing connection...');
      const response = await httpRequest.get('/health'); // or any simple endpoint
      console.log('🔌 PaymentService: Connection test successful:', response.status);
      return true;
    } catch (error) {
      console.log('🔌 PaymentService: Connection test failed (this is normal):', error.message);
      return false;
    }
  }

  /**
   * Fetch wallet balance from API
   */
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      console.log('💰 PaymentService: Fetching wallet balance...');
      
      const response = await httpRequest.get(endPoints.walletBalance);
      
      console.log('💰 PaymentService: Wallet balance response:', response);
      
      return {
        balance: response.data?.availableBalance || 0,
        pendingBalance: response.data?.pendingBalance || 0,
        currency: response.data?.currency || 'USD',
      };
    } catch (error) {
      console.error('💰 PaymentService: Error fetching wallet balance:', error);
      
      // Return default values on error
      return {
        balance: 0,
        pendingBalance: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Fetch bank accounts from API (connected accounts by user)
   */
  async getBankAccounts(userId: string | number): Promise<BankAccount[]> {
    console.log('🏦 PaymentService: getBankAccounts method called!');
    try {
      if (!userId) {
        console.log('🏦 PaymentService: No userId provided; returning empty list');
        return [];
      }

      console.log('🏦 PaymentService: Fetching connected bank accounts for user:', userId);
      const response = await httpRequest.get(endPoints.connectedBankAccounts(userId));

      const list = (response?.data?.data ?? response?.data ?? []) as any[];
      if (!Array.isArray(list)) {
        console.log('🏦 PaymentService: Unexpected connected accounts shape:', response?.data);
        return [];
      }

      const bankAccounts: BankAccount[] = list.map((account: any) => ({
        id: account.id?.toString() || account._id?.toString() || account.externalBankId || String(Date.now()),
        externalBankId: account.externalBankId || account.external_bank_id || account.id,
        accountName: account.accountHolderName || account.accountName || account.account_name || account.bankAccountName || `Account ****${account.last4 ?? ''}`,
        accountNumber: account.accountNumber || account.account_number || account.last4 || '',
        bankName: account.bankName || account.bank_name || account.institutionName || '',
        routingNumber: account.routingNumber || account.routing_number || '',
        accountType: (account.accountType || account.account_type || 'checking').toLowerCase(),
        isDefault: Boolean(account.defaultForCurrency ?? account.isDefault ?? account.is_default),
        isVerified: account.status ? account.status.toString().toLowerCase() === 'verified' : Boolean(account.isVerified || account.is_verified),
        isActive: account.isActive ?? true,
        country: account.country || 'US',
        currency: (account.currency || 'usd').toLowerCase(),
        last4: account.last4 || account.accountNumber?.slice(-4) || '',
        createdAt: account.createdAt || account.created_at || new Date().toISOString(),
        updatedAt: account.updatedAt || account.updated_at || new Date().toISOString(),
      }));

      console.log('🏦 PaymentService: Connected bank accounts fetched:', bankAccounts.length);
      return bankAccounts;
    } catch (error) {
      console.error('🏦 PaymentService: Error fetching bank accounts:', error);
      return [];
    }
  }

  /**
   * Delete a bank account
   */
  async addBankAccount(accountData: AddBankAccountRequest): Promise<BankAccount> {
    try {
      console.log('🏦 PaymentService: Adding bank account:', accountData);
      
      const response = await httpRequest.post(endPoints.addBankAccount, accountData);
      
      console.log('🏦 PaymentService: Add bank account response:', response);
      
      // Transform the response to match our BankAccount interface
      const newAccount: BankAccount = {
        id: response.data?.data?.id?.toString() || response.data?.id?.toString(),
        externalBankId: response.data?.data?.externalBankId || response.data?.externalBankId,
        accountName: response.data?.data?.accountName || response.data?.accountName || accountData.accountHolderName,
        accountNumber: response.data?.data?.accountNumber || response.data?.accountNumber || accountData.accountNumber,
        bankName: response.data?.data?.bankName || response.data?.bankName || accountData.bankName,
        routingNumber: response.data?.data?.routingNumber || response.data?.routingNumber || accountData.routingNumber,
        accountType: response.data?.data?.accountType || response.data?.accountType || accountData.accountType,
        isDefault: response.data?.data?.isDefault || response.data?.isDefault || false,
        isVerified: response.data?.data?.isVerified || response.data?.isVerified || false,
        isActive: response.data?.data?.isActive || response.data?.isActive || true,
        country: response.data?.data?.country || response.data?.country || accountData.country,
        currency: response.data?.data?.currency || response.data?.currency || 'usd',
        last4: response.data?.data?.last4 || response.data?.last4 || accountData.accountNumber.slice(-4),
        createdAt: response.data?.data?.createdAt || response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.data?.updatedAt || response.data?.updatedAt || new Date().toISOString(),
      };
      
      console.log('🏦 PaymentService: Processed new bank account:', newAccount);
      
      return newAccount;
    } catch (error) {
      console.error('🏦 PaymentService: Error adding bank account:', error);
      throw error;
    }
  }

  async deleteBankAccount(accountId: string): Promise<boolean> {
    try {
      console.log('🏦 PaymentService: Deleting bank account:', accountId);
      
      const response = await httpRequest.delete(endPoints.deleteBankAccount(accountId));
      
      console.log('🏦 PaymentService: Delete bank account response:', response);
      
      return response.data?.success || true;
    } catch (error) {
      console.error('🏦 PaymentService: Error deleting bank account:', error);
      throw error;
    }
  }

  /**
   * Create Stripe Connect account link for onboarding/management
   */
  async createConnectAccountLink(params: {
    userId: string | number;
    type?: 'account_onboarding' | 'account_update' | string;
    refreshUrl?: string;
    returnUrl?: string;
  }): Promise<{ accountId: string; url: string; created: number } | null> {
    try {
      const payload = {
        userId: String(params.userId),
        type: params.type || 'account_onboarding',
        refreshUrl: params.refreshUrl || '',
        returnUrl: params.returnUrl || '',
      };
      const response = await httpRequest.post(endPoints.connectAccountLink, payload);
      const data = response?.data?.data || response?.data;
      if (data?.url) {
        return { accountId: data.accountId, url: data.url, created: Number(data.created || Date.now()) };
      }
      return null;
    } catch (error) {
      console.error('🏦 PaymentService: Error creating connect account link:', error);
      return null;
    }
  }

  /**
   * Fetch payment methods from API (if available)
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      console.log('💰 PaymentService: Fetching payment methods...');
      
      // This endpoint might not exist yet, so we'll return empty array
      // const response = await httpService.get('/payment/methods');
      // return response.data || [];
      
      return [];
    } catch (error) {
      console.error('💰 PaymentService: Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Fetch transactions from API
   */
  async getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    try {
      console.log('💰 PaymentService: Fetching transactions...', { limit, offset });
      const url = `/payment/wallet/transactions?limit=${limit}&offset=${offset}`;
      const response = await httpRequest.get(url);

      // Many APIs wrap data in { data: [...] }
      const rawList = (response?.data?.data ?? response?.data ?? []) as any[];
      if (!Array.isArray(rawList)) {
        console.log('💰 PaymentService: Unexpected transactions shape:', response?.data);
        return [];
      }

      const transactions: Transaction[] = rawList.map((tx: any) => ({
        id: (tx.id ?? tx._id ?? Date.now()).toString(),
        type: tx.type ?? 'payment',
        amount: Number(tx.amount ?? 0),
        currency: tx.currency || 'USD',
        status: tx.status ?? 'completed',
        date: tx.date || tx.createdAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: tx.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        description: tx.description || 'Transaction',
        payerId: (tx.payerId ?? tx.payer_id ?? '').toString(),
        payeeId: (tx.payeeId ?? tx.payee_id ?? '').toString(),
        fee: Number(tx.fee ?? 0),
        jobId: tx.jobId ? tx.jobId.toString() : undefined,
        jobReference: tx.jobReference,
        paymentMethod: tx.paymentMethod,
      }));

      console.log('💰 PaymentService: Transactions fetched:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('💰 PaymentService: Error fetching transactions:', error);
      return [];
    }
  }
}

export const paymentService = new PaymentService();
