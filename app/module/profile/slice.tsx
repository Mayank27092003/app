/**
 * Profile slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

export const document = createAction<{}>('PROFILE/DOCUMENT');
export const editProfile = createAction<{}>('PROFILE/EDIT_PROFILES');
export const profile = createAction<{}>('PROFILE/PROFILES');
export const fetchProfile = createAction<{}>('PROFILE/FETCH_PROFILE');

