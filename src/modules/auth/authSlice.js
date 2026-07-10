import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

function safeHasToken() {
  try {
    return !!window.localStorage.getItem('managant-token');
  } catch {
    return false;
  }
}

function safeClearToken() {
  try {
    window.localStorage.removeItem('managant-token');
  } catch {
    // ignore
  }
}

export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    // Don't call /api/me if there is no stored token.
    if (!safeHasToken()) {
      return rejectWithValue('Sin token');
    }

    try {
      return await api.me();
    } catch (err) {
      // Token invalid/expired: clear it so we don't loop on every reload.
      safeClearToken();
      return rejectWithValue(err.message || 'Sesión inválida');
    }
  },
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const user = await api.loginWithGoogle(credentials);
      return user;
    } catch (err) {
      return rejectWithValue(err.message || 'Error al iniciar sesión');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: null,
    status: 'idle',
    error: null,
    restoreStatus: 'idle',
  },
  reducers: {
    logout(state) {
      state.currentUser = null;
      state.status = 'idle';
      state.error = null;
      state.restoreStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.restoreStatus = 'loading';
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.restoreStatus = 'succeeded';
        state.currentUser = action.payload;
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.restoreStatus = 'failed';
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUser = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error al iniciar sesión';
      });
  },
});

export const { logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
