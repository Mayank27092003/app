/**
 * PAYMENT slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

export const addPayment = createAction<{}>('PAYMENT/ADD_PAYMENTS');
export const deposit = createAction<{}>('PAYMENT/DEPOSIT');
export const paymentHistory = createAction<{}>('PAYMENT/PAYMENTS_HISTORY');
export const paymentMethod = createAction<{}>('PAYMENT/PAYMENTS_METHOD');
export const payment = createAction<{}>('PAYMENT/PAYMENTS');
export const transactionDetails = createAction<{}>('PAYMENT/TRANSACTION_DETAILS');
export const withDrawPayment = createAction<{}>('PAYMENT/WITHDRAW_PAYMENTS');


