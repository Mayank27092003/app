/**
 * Contract Invitations Sagas
 * @format
 */

import { put, takeLatest, call, select } from 'redux-saga/effects';
import { endPoints, httpRequest } from '@app/service';
import { showMessage } from 'react-native-flash-message';
import i18n from '@app/language/i18n';
import { presentLoader, dismissLoader, selectProfile } from '@app/module/common';
import {
  fetchContractInvitations,
  fetchContractInvitationsSuccess,
  fetchContractInvitationsFailure,
  acceptInvitation,
  declineInvitation,
  acceptInvitationRequest,
  declineInvitationRequest,
} from './slice';

/**
 * Fetch contract invitations saga
 */
function* fetchContractInvitationsSaga(action: any): any {
  const isSilent = action.payload?.silent === true;
  try {
    if (!isSilent) {
      yield put(presentLoader());
    }

    console.log('fetchContractInvitationsSaga - fetching contract invitations', { isSilent });

    const response = yield call(
      httpRequest.get,
      endPoints.getContractInvitations
    );

    console.log('fetchContractInvitationsSaga - API response:', response);

    if (response?.success && response?.data) {
      const invitations = response.data.map((invitation: any) => ({
        id: invitation.id.toString(),
        contractId: invitation.contractId.toString(),
        jobId: invitation.job?.id?.toString() || '',
        jobTitle: invitation.job?.title || 'Job Title',
        companyName: invitation.job?.companyName || 'Company',
        companyLogo: invitation.job?.companyLogo,
        description: invitation.job?.description || '',
        payAmount: parseFloat(invitation.job?.payAmount || '0'),
        currency: invitation.job?.currency || 'USD',
        vehicleType: invitation.job?.cargo?.cargoType || 'Truck',
        pickupLocation: invitation.job?.pickupLocation ?
          `${invitation.job.pickupLocation.address}, ${invitation.job.pickupLocation.city}, ${invitation.job.pickupLocation.state}` : '',
        dropoffLocation: invitation.job?.dropoffLocation ?
          `${invitation.job.dropoffLocation.address}, ${invitation.job.dropoffLocation.city}, ${invitation.job.dropoffLocation.state}` : '',
        message: `You have been invited for this ${invitation.job?.jobType || 'job'} assignment`,
        invitedDate: invitation.invitedAt || new Date().toISOString(),
        expiresDate: invitation.job?.endDate || new Date().toISOString(),
        status: invitation.status === 'invited' ? 'pending' : invitation.status,
        merchantId: invitation.job?.userId?.toString() || invitation.job?.companyId?.toString() || '',
        merchantName: invitation.job?.companyName || 'Company',
      }));

      console.log('fetchContractInvitationsSaga - Mapped invitations:', invitations);
      yield put(fetchContractInvitationsSuccess(invitations));
    } else {
      const errorMessage = response?.message || 'Failed to fetch contract invitations';
      yield put(fetchContractInvitationsFailure(errorMessage));
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('fetchContractInvitationsSaga - Error:', error);
    const errorMessage = error?.message || 'Failed to fetch contract invitations';
    yield put(fetchContractInvitationsFailure(errorMessage));
    showMessage({
      message: i18n.t("common.error"),
      description: errorMessage,
      type: "danger",
    });
  } finally {
    if (!isSilent) {
      yield put(dismissLoader());
    }
  }
}

/**
 * Accept invitation saga
 */
function* acceptInvitationSaga(action: any): any {
  try {
    yield put(presentLoader());

    const { invitationId, contractId } = action.payload;

    console.log('acceptInvitationSaga - accepting invitation:', { invitationId, contractId });

    const response = yield call(
      httpRequest.post,
      `/contract/${contractId}/accept`,
      { invitationId }
    );

    console.log('acceptInvitationSaga - API response:', response);

    if (response?.success) {
      yield put(acceptInvitation(invitationId));
      showMessage({
        message: i18n.t("common.invitationAccepted") || "Invitation Accepted",
        description: i18n.t("common.invitationAcceptedSuccess") || "Contract invitation has been accepted successfully!",
        type: "success",
      });
    } else {
      const errorMessage = response?.message || "Failed to accept invitation";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('acceptInvitationSaga - Error:', error);
    showMessage({
      message: i18n.t("common.error"),
      description: i18n.t("common.failedToAcceptInvitation") || "Failed to accept invitation. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Decline invitation saga
 */
function* declineInvitationSaga(action: any): any {
  try {
    yield put(presentLoader());

    const { invitationId, contractId } = action.payload;

    console.log('declineInvitationSaga - declining invitation:', { invitationId, contractId });

    const response = yield call(
      httpRequest.post,
      `/contract/${contractId}/decline`,
      { invitationId }
    );

    console.log('declineInvitationSaga - API response:', response);

    if (response?.success) {
      yield put(declineInvitation(invitationId));
      showMessage({
        message: i18n.t("common.invitationDeclined") || "Invitation Declined",
        description: i18n.t("common.invitationDeclinedSuccess") || "Contract invitation has been declined.",
        type: "info",
      });
    } else {
      const errorMessage = response?.message || "Failed to decline invitation";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('declineInvitationSaga - Error:', error);
    showMessage({
      message: i18n.t("common.error"),
      description: i18n.t("common.failedToDeclineInvitation") || "Failed to decline invitation. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Accept invitation saga
 */
function* acceptInvitationRequestSaga(action: any): any {
  try {
    yield put(presentLoader());

    const { contractId, invitationId, onSuccess, onError } = action.payload;

    // Get user profile to determine role
    const profile = yield select(selectProfile);
    const userRole = profile?.roles?.[0]?.role?.name;

    console.log('acceptInvitationRequestSaga - accepting invitation:', { contractId, invitationId, userRole });

    // Choose endpoint based on user role
    const endpoint = userRole === 'carrier'
      ? endPoints.acceptCarrierInvitation(parseInt(contractId))
      : endPoints.acceptContractInvitation(parseInt(contractId));

    console.log('acceptInvitationRequestSaga - using endpoint:', endpoint);

    const response = yield call(
      httpRequest.post,
      endpoint,
      {}
    );

    console.log('acceptInvitationRequestSaga - API response:', response);

    if (response?.success) {
      // Update local state
      // yield put(acceptInvitation({ invitationId, contractId }));

      showMessage({
        message: i18n.t("common.invitationAccepted") || "Invitation Accepted",
        description: i18n.t("common.invitationAcceptedJobSuccess") || "You have successfully accepted the job invitation!",
        type: "success",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errorMessage = response?.message || "Failed to accept invitation";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });

      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('acceptInvitationRequestSaga - Error:', error);
    const errorMessage = error?.message || "Failed to accept invitation. Please try again.";
    showMessage({
      message: i18n.t("common.error"),
      description: errorMessage,
      type: "danger",
    });

    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Decline invitation saga
 */
function* declineInvitationRequestSaga(action: any): any {
  try {
    yield put(presentLoader());

    const { contractId, invitationId, onSuccess, onError } = action.payload;

    // Get user profile to determine role
    const profile = yield select(selectProfile);
    const userRole = profile?.roles?.[0]?.role?.name;

    console.log('declineInvitationRequestSaga - declining invitation:', { contractId, invitationId, userRole });

    // Choose endpoint based on user role
    const endpoint = userRole === 'carrier'
      ? endPoints.declineCarrierInvitation(parseInt(contractId))
      : endPoints.declineContractInvitation(parseInt(contractId));

    console.log('declineInvitationRequestSaga - using endpoint:', endpoint);

    const response = yield call(
      httpRequest.post,
      endpoint,
      {}
    );

    console.log('declineInvitationRequestSaga - API response:', response);

    if (response?.success) {
      // Update local state
      // yield put(declineInvitation({ invitationId, contractId }));

      showMessage({
        message: i18n.t("common.invitationDeclined") || "Invitation Declined",
        description: i18n.t("common.invitationDeclinedJobSuccess") || "You have declined the job invitation.",
        type: "info",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errorMessage = response?.message || "Failed to decline invitation";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });

      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('declineInvitationRequestSaga - Error:', error);
    const errorMessage = error?.message || "Failed to decline invitation. Please try again.";
    showMessage({
      message: i18n.t("common.error"),
      description: errorMessage,
      type: "danger",
    });

    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

export function* contractInvitationsSaga() {
  yield takeLatest(fetchContractInvitations.type, fetchContractInvitationsSaga);
  yield takeLatest(acceptInvitation.type, acceptInvitationSaga);
  yield takeLatest(declineInvitation.type, declineInvitationSaga);
  yield takeLatest(acceptInvitationRequest.type, acceptInvitationRequestSaga);
  yield takeLatest(declineInvitationRequest.type, declineInvitationRequestSaga);
}
