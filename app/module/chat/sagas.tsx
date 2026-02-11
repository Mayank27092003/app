/**
 * Chat sagas
 * @format
 */

import { put, takeLatest } from 'redux-saga/effects';

//Screens
import { changeAppSection, setUser } from '@app/module/common';
import { AppSection } from '@app/navigator';
import { chat } from './slice';

/**
 *
 * @param {*} email
 */

function* chatSaga({ payload }: any) {
  try {
  } catch (error) {}
}



function* chatSagas() {
  yield takeLatest(chat, chatSaga);
}

export { chatSagas };
