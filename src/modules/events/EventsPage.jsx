import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../auth/authSlice.js';
import { fetchAreas, selectAreas } from '../areas/areasSlice.js';
import { fetchPeople, selectPeople } from '../people/peopleSlice.js';
import { createEventThunk, fetchEvents, selectEvents } from './eventsSlice.js';

function getAreaDescendants(areas, rootAreaId) {
  const ids = new Set([rootAreaId]);
  let changed = true;
  while (changed) {
    changed = false;
    areas.forEach((a) => {
      if (a.parentAreaId && ids.has(a.parentAreaId) && !ids.has(a.id)) {
        ids.add(a.id);
        changed = true;
      }
    });
  }
  return Array.from(ids);
}

export function EventsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const events = useSelector(selectEvents);
  const areas = useSelector(selectAreas);
  const people = useSelector(selectPeople);
  const currentUser = useSelector(selectCurrentUser);

  const isAdminUser = currentUser?.isAdmin;

  const managedRootAreas = useMemo(() => {
    if (!currentUser || isAdminUser) return [];
    return areas.filter(
      (a) =>
        a.responsiblePersonId === currentUser.personId ||
        a.helperPersonId === currentUser.personId,
    );
  }, [areas, currentUser, isAdminUser]);

  const visibleAreaIds = useMemo(() => {
    if (isAdminUser) return areas.map((a) => a.id);
    const ids = new Set();
    managedRootAreas.forEach((root) => {
      getAreaDescendants(areas, root.id).forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [areas, isAdminUser, managedRootAreas]);

  // Áreas en las que el usuario puede CREAR eventos.
  // Regla: responsable/ayudante del área (o ADMIN).
  const allowedAreasForCreate = useMemo(() => {
    if (!currentUser) return [];
    if (isAdminUser) return areas;
    return managedRootAreas;
  }, [areas, currentUser, isAdminUser, managedRootAreas]);

  const visibleEvents = useMemo(() => {
    if (isAdminUser) return events;
    if (visibleAreaIds.length === 0) return [];
    return events.filter((e) => visibleAreaIds.includes(e.areaId));
  }, [events, isAdminUser, visibleAreaIds]);

  const canCreateEvent =
    isAdminUser ||
    managedRootAreas.length > 0 ||
    // fallback: if backend gives access but areas aren't loaded yet
    false;

  const [dialogOpen, setDialogOpen] = useState(false);
  // Attendance now lives in a dedicated page.
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    areaId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchAreas());
    dispatch(fetchPeople());
  }, [dispatch, currentUser]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleEvents;
    return visibleEvents.filter((e) => e.title.toLowerCase().includes(q));
  }, [search, visibleEvents]);

  const handleOpenCreate = () => {
    if (!canCreateEvent) return;
    setForm({ title: '', areaId: '', startDate: '', endDate: '' });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.areaId || !form.startDate || !form.endDate) {
      setError('Todos los campos son obligatorios');
      return;
    }
    const result = await dispatch(
      createEventThunk({
        title: form.title.trim(),
        areaId: form.areaId,
        startDate: form.startDate,
        endDate: form.endDate,
        // createdByPersonId is derived from backend token
      }),
    );
    if (createEventThunk.rejected.match(result)) {
      setError(result.payload || result.error.message);
      return;
    }
    setSnackbar('Evento creado');
    setDialogOpen(false);
  };

  const handleOpenAttendance = (eventId) => {
    navigate(`/eventos/${eventId}/asistencia`);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Eventos
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Buscar"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          disabled={!canCreateEvent}
        >
          Nuevo evento
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Área</TableCell>
            <TableCell>Inicio</TableCell>
            <TableCell>Fin</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEvents.map((event) => {
            const area = areas.find((a) => a.id === event.areaId);
            return (
              <TableRow key={event.id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{area ? area.name : '-'}</TableCell>
                <TableCell>{event.startDate}</TableCell>
                <TableCell>{event.endDate}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpenAttendance(event.id)}
                  >
                    Asistencia
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Nuevo evento</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Título"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="area-label">Área</InputLabel>
            <Select
              labelId="area-label"
              label="Área"
              value={form.areaId}
              onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
            >
              {allowedAreasForCreate.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Fecha inicio"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.startDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, startDate: e.target.value }))
            }
          />
          <TextField
            type="date"
            label="Fecha fin"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}

