/**
 * Redux Store
 * create redux store with middleware,
 * enhancers & root reducer
 * configure redux persist
 * @format
 */

import { configureStore as reduxConfigureStore } from "@reduxjs/toolkit";
const createSagaMiddleware = require('redux-saga').default;

import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import { persistRootReducer } from "./root-reducer";
import { rootSaga } from "./root-saga";

/*-----------[ configure store ]------------*/ 
function configureStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = reduxConfigureStore({
    reducer: persistRootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(sagaMiddleware),
  });

  const persistor = persistStore(store);

  // Run sagas
  sagaMiddleware.run(rootSaga);

  return { store, persistor };
}

// Create and export store instance
const { store, persistor } = configureStore();

export { configureStore, store, persistor };
