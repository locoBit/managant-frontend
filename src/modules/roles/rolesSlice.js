import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

export const fetchRoles = createAsyncThunk('roles/fetchAll', async () => {
  return api.listRoles();
});

export const createRoleThunk = createAsyncThunk(
  'roles/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.createRole(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear rol');
    }
  },
);

export const updateRoleThunk = createAsyncThunk(
  'roles/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateRole(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al actualizar rol');
    }
  },
);

export const deleteRoleThunk = createAsyncThunk(
  'roles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteRole(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Error al eliminar rol');
    }
  },
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createRoleThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateRoleThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteRoleThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export const selectRoles = (state) => state.roles.items;
export const selectRolesStatus = (state) => state.roles.status;

export default rolesSlice.reducer;
