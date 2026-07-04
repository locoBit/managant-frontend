import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  return api.listUsers();
});

export const upsertUserThunk = createAsyncThunk(
  'users/upsert',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.upsertUser(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al guardar usuario');
    }
  },
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(upsertUserThunk.fulfilled, (state, action) => {
        const user = action.payload;
        const idx = state.items.findIndex((u) => u.id === user.id);
        if (idx >= 0) state.items[idx] = user;
        else state.items.push(user);
      })
      .addCase(upsertUserThunk.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectUsers = (state) => state.users.items;
export const selectUsersStatus = (state) => state.users.status;
export const selectUsersError = (state) => state.users.error;

export default usersSlice.reducer;
