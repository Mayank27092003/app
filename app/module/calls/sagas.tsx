/**
 * Call sagas
 * @format
 */

import { put, takeLatest } from 'redux-saga/effects';

//Screens
import { changeAppSection, setUser } from '@app/module/common';
import { AppSection } from '@app/navigator';
import { call,history } from './slice';

/**
 *
 * @param {*} email
 */

function* callSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* historySaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* callSagas() {
  yield takeLatest(call, callSaga);
  yield takeLatest(history, historySaga);
}

export { callSagas };
