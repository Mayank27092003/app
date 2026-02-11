/**
 * Root Reducer
 * combine all reducers to create root reducer
 * @format
 */

import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';

import { commonReducer } from '@app/module/common';
import { contractInvitationsReducer } from '@app/module/contract-invitations';

/*-----[ persist configurations ]------*/
const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const commonPersistConfig = {
  key: 'commonReducer',
  storage: AsyncStorage,
  blacklist: ['loader'],
};

const appReducer = combineReducers({
  commonReducer: persistReducer(commonPersistConfig, commonReducer),
  contractInvitationsReducer,
});

const rootReducer = (state: any, action: any) => {
  return appReducer(state, action);
};

const persistRootReducer = persistReducer(rootPersistConfig, rootReducer);

export type RootState = ReturnType<typeof rootReducer>;

export { persistRootReducer };
