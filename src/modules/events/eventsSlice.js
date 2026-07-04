import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/api.js';

export const fetchEvents = createAsyncThunk('events/fetchAll', async () => {
  return api.listEvents();
});

export const createEventThunk = createAsyncThunk(
  'events/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.createEvent(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear evento');
    }
  },
);

export const registerAttendanceThunk = createAsyncThunk(
  'events/registerAttendance',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.registerAttendance(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al registrar asistencia');
    }
  },
);

export const upsertAttendanceThunk = createAsyncThunk(
  'events/upsertAttendance',
  async (payload, { rejectWithValue }) => {
    try {
      return await api.upsertAttendance(payload);
    } catch (err) {
      return rejectWithValue(err.message || 'Error al actualizar asistencia');
    }
  },
);

export const updateEventObservationsThunk = createAsyncThunk(
  'events/updateEventObservations',
  async ({ eventId, observations }, { rejectWithValue }) => {
    try {
      return await api.updateEventObservations(eventId, { observations });
    } catch (err) {
      return rejectWithValue(err.message || 'Error al guardar observaciones');
    }
  },
);

export const fetchAttendancesByEvent = createAsyncThunk(
  'events/fetchAttendancesByEvent',
  async (eventId) => api.listAttendancesByEvent(eventId),
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    attendancesByEvent: {},
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createEventThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(fetchAttendancesByEvent.fulfilled, (state, action) => {
        const eventId = action.meta.arg;
        state.attendancesByEvent[eventId] = action.payload;
      })
      .addCase(registerAttendanceThunk.fulfilled, (state, action) => {
        const attendance = action.payload;
        const list = state.attendancesByEvent[attendance.eventId] || [];
        state.attendancesByEvent[attendance.eventId] = [...list, attendance];
      })
      .addCase(upsertAttendanceThunk.fulfilled, (state, action) => {
        const a = action.payload;
        if (!a?.eventId || !a?.personId) return;

        const list = state.attendancesByEvent[a.eventId] || [];

        // Backend returns empty id when present=false (we delete). Treat that as remove.
        if (!a.id) {
          state.attendancesByEvent[a.eventId] = list.filter(
            (x) => x.personId !== a.personId,
          );
          return;
        }

        const idx = list.findIndex((x) => x.personId === a.personId);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = { ...copy[idx], ...a };
          state.attendancesByEvent[a.eventId] = copy;
        } else {
          state.attendancesByEvent[a.eventId] = [...list, a];
        }
      })
      .addCase(updateEventObservationsThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((e) => e.id === updated.id);
        if (idx >= 0) state.items[idx] = updated;
      });
  },
});

export const selectEvents = (state) => state.events.items;
export const selectAttendancesByEvent = (state, eventId) =>
  state.events.attendancesByEvent[eventId] || [];

export default eventsSlice.reducer;
