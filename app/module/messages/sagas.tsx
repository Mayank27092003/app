/**
 * Message sagas
 * @format
 */

import { put, takeLatest } from 'redux-saga/effects';

//Screens
import { changeAppSection, setUser } from '@app/module/common';
import { AppSection } from '@app/navigator';
import { message } from './slice';

/**
 *
 * @param {*} email
 */

function* messageSaga({ payload }: any) {
  try {
  } catch (error) {}
}



function* messagesSagas() {
  yield takeLatest(message, messageSaga);
}

export { messagesSagas };
