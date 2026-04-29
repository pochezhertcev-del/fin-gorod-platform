import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

interface AuthState {
  accessToken: string | null;
  user: { id: number; firstName: string; role: string } | null;
}

interface ProgressState {
  balance: number;
  difficultyLevel: number;
  unlockedDistricts: string[];
  achievementsEarned: number[];
}

const initialAuth: AuthState = { accessToken: null, user: null };
const initialProgress: ProgressState = {
  balance: 0,
  difficultyLevel: 1,
  unlockedDistricts: ['money_functions'],
  achievementsEarned: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setAuth(state, action: PayloadAction<AuthState>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

const progressSlice = createSlice({
  name: 'progress',
  initialState: initialProgress,
  reducers: {
    addCoins(state, action: PayloadAction<number>) {
      state.balance += action.payload;
    },
    spendCoins(state, action: PayloadAction<number>) {
      state.balance = Math.max(0, state.balance - action.payload);
    },
    unlockDistrict(state, action: PayloadAction<string>) {
      if (!state.unlockedDistricts.includes(action.payload)) {
        state.unlockedDistricts.push(action.payload);
      }
    },
    earnAchievement(state, action: PayloadAction<number>) {
      if (!state.achievementsEarned.includes(action.payload)) {
        state.achievementsEarned.push(action.payload);
      }
    },
    setDifficulty(state, action: PayloadAction<number>) {
      state.difficultyLevel = Math.max(1, Math.min(5, action.payload));
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export const {
  addCoins,
  spendCoins,
  unlockDistrict,
  earnAchievement,
  setDifficulty,
} = progressSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    progress: progressSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
