/**
 * Common sagas
 * @format
 */

import { call, put, takeLatest } from "redux-saga/effects";
import { presentLoader, dismissLoader, setDocumentTypes, fetchDocumentTypes, uploadDocument, setProfile, deleteDocument } from "./slice";
import { showMessage } from "react-native-flash-message";
import { endPoints, httpRequest } from "@app/service";
import i18n from "@app/language/i18n";

/**
 * Upload document saga
 * @param {*} action - Upload document action with document data
 */
function* uploadDocumentSaga(action: any): any {
  try {
    const { documentData, onSuccess, onError } = action.payload;
console.log("documentDataaaaaa", documentData);
    // Make the document upload request
    const response = yield call(httpRequest.post, endPoints.documentUpload, documentData);

    if (response?.success) {
      showMessage({
        message: i18n.t("common.documentUploadedSuccess"),
        type: "success",
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || i18n.t("common.failedToUploadDocument");
      
      showMessage({
        message: errorMessage,
        type: "danger",
      });

      if (onError) {
        onError(response);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Document upload failed. Please try again.";
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });

    if (action.payload.onError) {
      action.payload.onError(error);
    }
  }
}

/**
 * Fetch user documents saga
 */
function* fetchUserDocumentsSaga(): any {
  try {
    const response = yield call(httpRequest.get, endPoints.userDocuments);

    if (response?.success) {
      // Update the profile with documents
      yield put(setProfile({ 
        ...response.data,
        documents: response.data.documents || []
      }));
    } else if (response && Array.isArray(response)) {
      // Handle case where API returns array directly
      yield put(setProfile({ 
        documents: response 
      }));
    } else if (response && response.data && Array.isArray(response.data)) {
      // Handle case where API returns {data: [...]} without success flag
      yield put(setProfile({ 
        documents: response.data 
      }));
    } else {
      showMessage({
        message: i18n.t("common.unexpectedResponseFormat") || "Unexpected response format from documents API",
        type: "danger",
      });
    }
  } catch (error: any) {
    showMessage({
      message: error?.message || i18n.t("common.failedToFetchDocuments") || "Failed to fetch user documents",
      type: "danger",
    });
  }
}

/**
 * Fetch document types saga
 */
function* fetchDocumentTypesSaga(): any {
  try {
    const response = yield call(httpRequest.get, endPoints.documentTypes);

    if (response?.success) {
      yield put(setDocumentTypes(response.data || []));
    } else if (response && Array.isArray(response)) {
      // Handle case where API returns array directly
      yield put(setDocumentTypes(response));
    } else if (response && response.data && Array.isArray(response.data)) {
      // Handle case where API returns {data: [...]} without success flag
      yield put(setDocumentTypes(response.data));
    } else {
      showMessage({
        message: i18n.t("common.unexpectedResponseFormat") || "Unexpected response format from API",
        type: "danger",
      });
    }
  } catch (error: any) {
    showMessage({
      message: error?.message || i18n.t("common.failedToFetchDocumentTypes") || "Failed to fetch document types",
      type: "danger",
    });
  }
}

/**
 * File upload action saga
 * @param {*} action - Upload action with file data
 */
function* uploadFileSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { file, onSuccess, onError } = action.payload;

    // Create FormData for multipart/form-data
    const formData = new FormData();
    const fileBlob = {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'file',
    } as any;
    
    formData.append('file', fileBlob);
console.log("formData for doccc", formData);
    // Make the actual upload request to the API
    const response = yield call(httpRequest.post, endPoints.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response) {
      console.log(response, "response upload file");
      showMessage({
        message: i18n.t("common.fileUploadedSuccess") || "File uploaded successfully!",
        type: "success",
      });

      onSuccess(response);
    } else {
      const errorMessage = response?.message || i18n.t("common.failedToUploadFile");
      
      showMessage({
        message: errorMessage,
        type: "danger",
      });

      if (onError) {
        onError(response);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Upload failed. Please try again.";
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });

    if (action.payload.onError) {
      action.payload.onError(error);
    }
  } finally {
    yield put(dismissLoader());
  }
}

function* deleteDocumentSaga(action: any): any {
  try {
    const { documentId, onSuccess, onError } = action.payload;
    
    const response = yield call(httpRequest.delete, endPoints.documentDelete(documentId));
    console.log("response delete", response);
    if (response?.success) {
      showMessage({ message: i18n.t("common.documentDeletedSuccess"), type: "success" });
      if (onSuccess) { onSuccess(); }
    } else {
      const errorMessage = response?.message || i18n.t("common.failedToDeleteDocument");
      showMessage({ message: errorMessage, type: "danger" });
      if (onError) { onError(response); }
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Document deletion failed. Please try again.";
    showMessage({ message: errorMessage, type: "danger" });
    if (action.payload.onError) { action.payload.onError(error); }
  }
}

/**
 * Upload voice message saga
 * @param {*} action - Upload voice message action with voice data
 */
function* uploadVoiceMessageSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { voiceData, onSuccess, onError } = action.payload;
    
    console.log("🎤 Saga - Starting voice message upload");
    console.log("🎤 Saga - Voice data:", {
      fileUri: voiceData.fileUri,
      fileName: voiceData.fileName,
      duration: voiceData.duration
    });

    // First, test server connectivity with a simple GET request
    try {
      console.log("🔍 Testing server connectivity...");
      const testResponse = yield call(httpRequest.get, '/user/profile');
      console.log("🔍 Server connectivity test passed:", testResponse);
    } catch (testError) {
      console.error("🔍 Server connectivity test failed:", testError);
      // Continue with upload attempt even if test fails
    }

    // Create FormData for multipart/form-data
    const formData = new FormData();
    const fileBlob = {
      uri: voiceData.fileUri,
      type: 'audio/m4a', // Use correct MIME type for m4a files
      name: voiceData.fileName,
    } as any;
    
    formData.append('file', fileBlob);
    
    // Add additional metadata for voice messages
    if (voiceData.duration) {
      formData.append('duration', voiceData.duration.toString());
    }
    formData.append('messageType', 'voice');
    
    console.log("🎤 Saga - FormData created for voice upload:", {
      fileUri: voiceData.fileUri,
      fileName: voiceData.fileName,
      fileType: 'audio/m4a',
      duration: voiceData.duration,
      messageType: 'voice'
    });

    // Log the exact request details before making the call
    console.log("🎤 Saga - Making upload request to:", endPoints.upload);
    console.log("🎤 Saga - Request headers will include:", {
      'Content-Type': 'multipart/form-data',
      'Authorization': 'Bearer [HIDDEN]'
    });

    // Make the voice upload request to the API
    const response = yield call(httpRequest.post, endPoints.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("🎤 Saga - Upload response:", response);

    if (response) {
      console.log("🎤 Saga - Voice message uploaded successfully");
      
     
      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || i18n.t("common.voiceUploadFailed") || "Voice upload failed. Please try again.";
      
      console.error("🎤 Saga - Upload failed:", errorMessage);
      
      showMessage({
        message: errorMessage,
        type: "danger",
      });

      if (onError) {
        onError(response);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Voice upload failed. Please try again.";
    
    console.error("🎤 Saga - Upload error:", error);
    console.error("🎤 Saga - Error details:", {
      message: error?.message,
      status: error?.status,
      response: error?.response,
      request: error?.request,
      config: error?.config
    });
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });

    if (action.payload.onError) {
      action.payload.onError(error);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Send voice message saga
 * @param {*} action - Send voice message action with message data
 */
function* sendVoiceMessageSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { messageData, onSuccess, onError } = action.payload;
    
    console.log("📤 Saga - Starting voice message send");
    console.log("📤 Saga - Message data:", {
      conversationId: messageData.conversationId,
      content: messageData.content,
      messageType: messageData.messageType,
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      metadata: messageData.metadata
    });

    // Send the message to conversation endpoint
    const endpoint = endPoints.getMessages(messageData.conversationId);
    const response = yield call(httpRequest.post, endpoint, {
      content: messageData.content,
      messageType: messageData.messageType,
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      fileSize: messageData.fileSize,
      metadata: messageData.metadata
    });

    console.log("📤 Saga - Send response:", response);

    if (response) {
      console.log("📤 Saga - Voice message sent successfully");
      
      showMessage({
        message: i18n.t("common.voiceMessageSentSuccess") || "Voice message sent successfully!",
        type: "success",
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || "Voice message send failed. Please try again.";
      
      console.error("📤 Saga - Send failed:", errorMessage);
      
      showMessage({
        message: errorMessage,
        type: "danger",
      });

      if (onError) {
        onError(response);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.message || i18n.t("common.voiceMessageSendFailed") || "Voice message send failed. Please try again.";
    
    console.error("📤 Saga - Send error:", error);
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });

    if (action.payload.onError) {
      action.payload.onError(error);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Common sagas
 */
export function* commonSagas() {
  yield takeLatest("COMMON/UPLOAD_FILE", uploadFileSaga);
  yield takeLatest("COMMON/UPLOAD_DOCUMENT", uploadDocumentSaga);
  yield takeLatest("COMMON/DELETE_DOCUMENT", deleteDocumentSaga);
  yield takeLatest("COMMON/UPLOAD_VOICE_MESSAGE", uploadVoiceMessageSaga);
  yield takeLatest("COMMON/SEND_VOICE_MESSAGE", sendVoiceMessageSaga);
  yield takeLatest(fetchDocumentTypes, fetchDocumentTypesSaga);
  yield takeLatest("COMMON/FETCH_USER_DOCUMENTS", fetchUserDocumentsSaga);
}