/**
 * Contract Invitations Slice
 * @format
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ContractInvitation {
  id: string;
  contractId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  description: string;
  payAmount: number;
  currency: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  message: string;
  invitedDate: string;
  expiresDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  merchantId: string;
  merchantName: string;
}

interface ContractInvitationsState {
  invitations: ContractInvitation[];
  loading: boolean;
  error: string | null;
  pendingCount: number;
}

const initialState: ContractInvitationsState = {
  invitations: [],
  loading: false,
  error: null,
  pendingCount: 0,
};

const contractInvitationsSlice = createSlice({
  name: 'contractInvitations',
  initialState,
  reducers: {
    fetchContractInvitations: (state, action: PayloadAction<{ silent?: boolean } | undefined>) => {
      if (!action.payload?.silent) {
        state.loading = true;
      }
      state.error = null;
    },
    fetchContractInvitationsSuccess: (state, action: PayloadAction<ContractInvitation[]>) => {
      state.loading = false;
      state.invitations = action.payload;
      state.pendingCount = action.payload.filter(inv => inv.status === 'pending').length;
      state.error = null;
    },
    fetchContractInvitationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    acceptInvitation: (state, action: PayloadAction<{ invitationId: string, contractId: string }>) => {
      const { invitationId } = action.payload;
      const invitation = state.invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        invitation.status = 'accepted';
        state.pendingCount = state.invitations.filter(inv => inv.status === 'pending').length;
      }
    },
    declineInvitation: (state, action: PayloadAction<{ invitationId: string, contractId: string }>) => {
      const { invitationId } = action.payload;
      const invitation = state.invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        invitation.status = 'declined';
        state.pendingCount = state.invitations.filter(inv => inv.status === 'pending').length;
      }
    },
    clearContractInvitations: (state) => {
      state.invitations = [];
      state.pendingCount = 0;
      state.error = null;
    },
    // API action creators for accept/decline
    acceptInvitationRequest: (state, action: PayloadAction<{ contractId: string, invitationId: string, onSuccess?: () => void, onError?: (error: string) => void }>) => {
      // This will be handled by saga
    },
    declineInvitationRequest: (state, action: PayloadAction<{ contractId: string, invitationId: string, onSuccess?: () => void, onError?: (error: string) => void }>) => {
      // This will be handled by saga
    },
  },
});

export const {
  fetchContractInvitations,
  fetchContractInvitationsSuccess,
  fetchContractInvitationsFailure,
  acceptInvitation,
  declineInvitation,
  clearContractInvitations,
  acceptInvitationRequest,
  declineInvitationRequest,
} = contractInvitationsSlice.actions;

export default contractInvitationsSlice.reducer;
