/**
 * Call slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

export const call = createAction<{}>('CALL/CALL');
export const history = createAction<{}>('CALL/HISTORY');
