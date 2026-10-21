import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import excelReducer from "./excelSlice";
import storage from "./storage";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Performance Optimization: Only persist 'auth' in storage.
// Persisting large Excel datasets to localStorage blocks the main thread
// with synchronous multi-megabyte JSON stringification on every action.
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  excel: excelReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export default store;
