/**
 * Profile sagas
 * @format
 */

import { call, put, takeLatest } from "redux-saga/effects";

//Screens
import { setCompany, setProfile } from "@app/module/common";
import { editProfile, fetchProfile } from "./slice";
import { showMessage } from "react-native-flash-message";
import i18n from "@app/language/i18n";
import { endPoints, httpRequest } from "@app/service";


/**
 * update profile saga
 * @param {*} action - update profile 
 */
function* editProfileSaga(action: any): any {
  try {
    const data = action.payload; // Get payload
    console.log(data, "profile data payload");

    // Correct API call
    const response = yield call(httpRequest.put, endPoints.profile, data);
    console.log("Profile update response:", response);
    console.log("Response data:", response?.data);
    
    if (response?.success || response?.status === 200) {
      if (response?.data?.user) {
        yield put(setProfile({ ...response?.data?.user }));
      }
      if (response?.data?.company) {
        yield put(setCompany({ ...response?.data?.company }));
      }
    } else {
      throw new Error(response?.message || response?.data?.message || "Profile update failed");
    }

    showMessage({
      message: i18n.t("common.profileUpdatedSuccess") || "Profile updated successfully!",
      type: "success",
    });
    
    // Fetch updated profile data to refresh the screen
    yield put(fetchProfile());
  } catch (error: any) {
    console.error("Profile update error:", error);
    console.error("Error response:", error?.response?.data);
    console.error("Error status:", error?.response?.status);
    
    let errorMessage = "Failed to update profile";
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    showMessage({
      message: errorMessage,
      type: "danger",
    });
  }
}

/**
 * Fetch profile saga
 * @param {*} action - Fetch profile action
 */
function* fetchProfileSaga(action: any): any {
  try {
    const response = yield call(httpRequest.get, endPoints.profile);
    console.log("Fetch profile response:", response);
    console.log("Fetch profile response data:", response?.data);
    
    if (response?.success || response?.status === 200) {
      if (response?.data) {
        console.log("Setting profile data:", response?.data);
        yield put(setProfile({ ...response?.data }));
      }
      if (response?.data?.company) {
        console.log("Setting company data:", response?.data?.company);
        yield put(setCompany({ ...response?.data?.company }));
      }
    } else {
      console.log("Profile fetch failed - response not successful");
    }
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    console.error("Fetch profile error response:", error?.response?.data);
  }
}

function* profilesSagas() {
  yield takeLatest(editProfile, editProfileSaga);
  yield takeLatest(fetchProfile, fetchProfileSaga);
}

export { profilesSagas };
