/**
 * Notification sagas
 * @format
 */

import { put, takeLatest } from 'redux-saga/effects';

//Screens
import { changeAppSection, setUser } from '@app/module/common';
import { AppSection } from '@app/navigator';
import { addPayment, deposit, paymentHistory, paymentMethod, payment, transactionDetails,withDrawPayment } from './slice';

/**
 *
 * @param {*} email
 */

function* addPaymentSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* depositSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* paymentHistorySaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* paymentMethodSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* paymnetSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* transactionDetailsSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* withDrawPaymentSaga({ payload }: any) {
  try {
  } catch (error) {}
}



function* paymentsSagas() {
  yield takeLatest(addPayment, addPaymentSaga);
  yield takeLatest(paymentHistory, paymentHistorySaga);
  yield takeLatest(paymentMethod, paymentMethodSaga);
  yield takeLatest(payment, paymnetSaga);
  yield takeLatest(withDrawPayment, withDrawPaymentSaga);
  yield takeLatest(deposit, depositSaga);
  yield takeLatest(transactionDetails, transactionDetailsSaga);
}

export { paymentsSagas };
