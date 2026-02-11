/**
 * Notification sagas
 * @format
 */

import { put, takeLatest } from 'redux-saga/effects';

//Screens
import { changeAppSection, setUser } from '@app/module/common';
import { AppSection } from '@app/navigator';
import { notification } from './slice';

/**
 *
 * @param {*} email
 */

function* notificationSaga({ payload }: any) {
  try {
  } catch (error) {}
}



function* notificationsSagas() {
  yield takeLatest(notification, notificationSaga);
}

export { notificationsSagas };
