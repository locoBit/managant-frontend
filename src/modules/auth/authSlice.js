import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

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
  },
  reducers: {
    logout(state) {
      state.currentUser = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
