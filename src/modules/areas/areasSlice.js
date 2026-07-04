import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

export const fetchAreas = createAsyncThunk('areas/fetchAll', async () => {
  return api.listAreas();
});

export const fetchAreaCategories = createAsyncThunk(
  'areas/fetchCategories',
  async () => api.listAreaCategories(),
);

export const createAreaCategoryThunk = createAsyncThunk(
  'areas/createCategory',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.createAreaCategory(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear categoría');
    }
  },
);

export const createAreaThunk = createAsyncThunk(
  'areas/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.createArea(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear área');
    }
  },
);

export const updateAreaThunk = createAsyncThunk(
  'areas/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await api.updateArea(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al actualizar área');
    }
  },
);

const areasSlice = createSlice({
  name: 'areas',
  initialState: {
    items: [],
    categories: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAreas.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAreas.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAreas.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchAreaCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(createAreaCategoryThunk.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(createAreaThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateAreaThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      });
  },
});

export const selectAreas = (state) => state.areas.items;
export const selectAreaCategories = (state) => state.areas.categories;
export const selectAreasStatus = (state) => state.areas.status;

export default areasSlice.reducer;
