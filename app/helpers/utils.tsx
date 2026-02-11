/**
 * App utilites
 * @format
 */

import { API_SECRET_KEY } from '@app/configs';
import md5 from 'md5'; // ✅ Correct ES6 import
// import md5 = require('md5');
import { showMessage } from 'react-native-flash-message';

/**
 * Convert Json to FormData
 * @param {*} param
 * @returns
 */
export const toFormData = (param = {}) => {
  let formData = new FormData();
  Object.entries(param).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

/**
 * Validate phone number
 * @param phoneNumber
 * @returns
 */
export const validatePhoneNumber = phoneNumber => {
  const phoneRegex = /^[0-9]{10}$/; // Regex for exactly 10 digits
  if (phoneRegex.test(phoneNumber)) {
    return true;
  } else {
    showMessage({
      message: 'Please enter a valid 10-digit phone number.',
      type: 'danger',
    });
    return false;
  }
};

/**
 * Create md5 token
 */

export const createMd5Token = (param: {}) => {
  const hashString = Object.values({
    start_key: API_SECRET_KEY,
    ...param,
    end_key: API_SECRET_KEY,
  }).join('');
  const token = md5(hashString);
  return token;
};

/**
 * Convert string to int
 * @param value
 * @returns
 */
export const toFixedTwoDecimal = (value: any = '') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Invalid number input');
  }
  return num.toFixed(2);
};
