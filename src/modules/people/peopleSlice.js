import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

export const fetchPeople = createAsyncThunk('people/fetchAll', async () => {
  return api.listPeople();
});

export const createPersonThunk = createAsyncThunk(
  'people/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.createPerson(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear persona');
    }
  },
);

export const updatePersonThunk = createAsyncThunk(
  'people/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updatePerson(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al actualizar persona');
    }
  },
);

export const assignPersonToAreaWithRoleThunk = createAsyncThunk(
  'people/assignToAreaWithRole',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.assignPersonToAreaWithRole(payload);
    } catch (err) {
      return rejectWithValue(
        err.message || 'Error al asignar persona al área con rol',
      );
    }
  },
);

export const unassignPersonFromAreaWithRoleThunk = createAsyncThunk(
  'people/unassignFromAreaWithRole',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.unassignPersonFromAreaWithRole(payload);
    } catch (err) {
      return rejectWithValue(
        err.message || 'Error al quitar rol de la persona en el área',
      );
    }
  },
);

export const changePersonRoleInAreaThunk = createAsyncThunk(
  'people/changeRoleInArea',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.changePersonRoleInArea(payload);
    } catch (err) {
      return rejectWithValue(
        err.message || 'Error al cambiar rol en el área',
      );
    }
  },
);

export const softDeletePersonThunk = createAsyncThunk(
  'people/softDelete',
  async (personId, { rejectWithValue }) => {
    try {
      await api.softDeletePerson(personId);
      return personId;
    } catch (err) {
      return rejectWithValue(err.message || 'Error al desactivar persona');
    }
  },
);

const peopleSlice = createSlice({
  name: 'people',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeople.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPeople.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPeople.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createPersonThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updatePersonThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(assignPersonToAreaWithRoleThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(unassignPersonFromAreaWithRoleThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(changePersonRoleInAreaThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(softDeletePersonThunk.fulfilled, (state, action) => {
        const id = action.payload;
        const idx = state.items.findIndex((p) => p.id === id);
        if (idx >= 0) state.items[idx] = { ...state.items[idx], active: false };
      });
  },
});

export const selectPeople = (state) => state.people.items;
export const selectPeopleStatus = (state) => state.people.status;

export default peopleSlice.reducer;
