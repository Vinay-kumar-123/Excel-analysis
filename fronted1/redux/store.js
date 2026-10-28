import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import excelReducer from "./excelSlice";
import historyReducer from "./historySlice";
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

// Persist history, but not full spreadsheet data, to avoid serializing large workbooks.
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth", "history"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  excel: excelReducer,
  history: historyReducer,
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
