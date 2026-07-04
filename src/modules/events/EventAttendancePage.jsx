import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAreas, selectAreas } from '../areas/areasSlice.js';
import { fetchPeople, selectPeople } from '../people/peopleSlice.js';
import {
  fetchAttendancesByEvent,
  fetchEvents,
  selectAttendancesByEvent,
  selectEvents,
  updateEventObservationsThunk,
  upsertAttendanceThunk,
} from './eventsSlice.js';

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

function personLabel(p) {
  return `${p.firstNames} ${p.lastName}`.trim();
}

export function EventAttendancePage() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const areas = useSelector(selectAreas);
  const people = useSelector(selectPeople);
  const events = useSelector(selectEvents);
  const attendances = useSelector((state) =>
    selectAttendancesByEvent(state, eventId),
  );

  const event = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId],
  );

  const [includeSubareas, setIncludeSubareas] = useState(true);
  const [eventObservations, setEventObservations] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // Draft attendance changes are kept locally and saved in one shot.
  const [draftByPersonId, setDraftByPersonId] = useState({});
  const draftTouchedRef = useRef(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState({
    totalChanges: 0,
    toAdd: [],
    toRemove: [],
    toUpdateObs: [],
  });

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchAreas());
    dispatch(fetchPeople());
  }, [dispatch]);

  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchAttendancesByEvent(eventId));
  }, [dispatch, eventId]);

  useEffect(() => {
    setEventObservations(event?.observations || '');
  }, [event?.observations]);

  const eventAreaName = useMemo(() => {
    if (!event?.areaId) return '';
    return areas.find((a) => a.id === event.areaId)?.name || '';
  }, [areas, event?.areaId]);

  const allowedPeople = useMemo(() => {
    if (!event?.areaId) return [];

    const allowedAreaIds = includeSubareas
      ? getAreaDescendants(areas, event.areaId)
      : [event.areaId];

    return people
      .filter((p) => p.active !== false)
      .filter((p) =>
        (p.areas || []).some((rel) => allowedAreaIds.includes(rel.areaId)),
      )
      .sort((a, b) => personLabel(a).localeCompare(personLabel(b)));
  }, [people, event?.areaId, includeSubareas, areas]);

  const attendanceByPersonId = useMemo(() => {
    const map = new Map();
    (attendances || []).forEach((a) => map.set(a.personId, a));
    return map;
  }, [attendances]);

  // Initialize draft from backend snapshot, but never overwrite user edits.
  useEffect(() => {
    if (draftTouchedRef.current) return;
    const next = {};
    (allowedPeople || []).forEach((p) => {
      const a = attendanceByPersonId.get(p.id);
      next[p.id] = {
        present: !!a,
        observations: a?.observations || '',
      };
    });
    setDraftByPersonId(next);
  }, [allowedPeople, attendanceByPersonId]);

  const setDraft = (personId, patch) => {
    draftTouchedRef.current = true;
    setDraftByPersonId((prev) => ({
      ...prev,
      [personId]: { ...(prev[personId] || {}), ...patch },
    }));
  };

  const computeSummary = () => {
    const toAdd = [];
    const toRemove = [];
    const toUpdateObs = [];

    (allowedPeople || []).forEach((p) => {
      const current = attendanceByPersonId.get(p.id);
      const draft = draftByPersonId[p.id] || { present: false, observations: '' };

      const currentPresent = !!current;
      const draftPresent = !!draft.present;

      if (currentPresent !== draftPresent) {
        if (draftPresent) toAdd.push(p);
        else toRemove.push(p);
      } else if (draftPresent) {
        const currObs = (current?.observations || '').trim();
        const draftObs = (draft.observations || '').trim();
        if (currObs !== draftObs) {
          toUpdateObs.push(p);
        }
      }
    });

    return {
      toAdd,
      toRemove,
      toUpdateObs,
      totalChanges: toAdd.length + toRemove.length + toUpdateObs.length,
    };
  };

  const handleOpenConfirm = () => {
    const summary = computeSummary();
    setConfirmSummary(summary);
    setConfirmOpen(true);
  };

  const handleSaveAll = async () => {
    const summary = computeSummary();
    if (summary.totalChanges === 0) {
      setConfirmOpen(false);
      setSnackbar('No hay cambios por guardar');
      return;
    }

    setSaving(true);
    try {
      for (const p of summary.toAdd) {
        const draft = draftByPersonId[p.id] || {};
        const result = await dispatch(
          upsertAttendanceThunk({
            eventId,
            personId: p.id,
            present: true,
            includeSubareas,
            observations: draft.observations || '',
          }),
        );
        if (upsertAttendanceThunk.rejected.match(result)) {
          throw new Error(result.payload || result.error.message);
        }
      }

      for (const p of summary.toUpdateObs) {
        const draft = draftByPersonId[p.id] || {};
        const result = await dispatch(
          upsertAttendanceThunk({
            eventId,
            personId: p.id,
            present: true,
            includeSubareas,
            observations: draft.observations || '',
          }),
        );
        if (upsertAttendanceThunk.rejected.match(result)) {
          throw new Error(result.payload || result.error.message);
        }
      }

      for (const p of summary.toRemove) {
        const result = await dispatch(
          upsertAttendanceThunk({
            eventId,
            personId: p.id,
            present: false,
            includeSubareas,
          }),
        );
        if (upsertAttendanceThunk.rejected.match(result)) {
          throw new Error(result.payload || result.error.message);
        }
      }

      await dispatch(fetchAttendancesByEvent(eventId));
      draftTouchedRef.current = false;
      setConfirmOpen(false);
      setError('');
      setSnackbar('Asistencia guardada');
    } catch (e) {
      setError(e.message || 'Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEventObservations = async () => {
    if (!eventId) return;

    setSaving(true);
    try {
      const result = await dispatch(
        updateEventObservationsThunk({
          eventId,
          observations: eventObservations,
        }),
      );
      if (updateEventObservationsThunk.rejected.match(result)) {
        setError(result.payload || result.error.message);
      } else {
        setError('');
        setSnackbar('Observaciones guardadas');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    return (
      <Box>
        <Typography variant="h6">Asistencia</Typography>
        <Typography variant="body2" color="text.secondary">
          Cargando evento...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/eventos')}>
          Volver
        </Button>
        <Typography variant="h5">
          Asistencia: {event.title}
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Area del evento: {eventAreaName || event.areaId}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={includeSubareas}
            onChange={(e) => setIncludeSubareas(e.target.checked)}
          />
        }
        label="Incluir sub-areas"
      />

      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Observaciones (reunion)
        </Typography>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            multiline
            minRows={2}
            fullWidth
            value={eventObservations}
            onChange={(e) => setEventObservations(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleSaveEventObservations}
            disabled={saving}
          >
            Guardar
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleOpenConfirm}
          disabled={saving}
        >
          Guardar asistencia
        </Button>
        <Button
          variant="outlined"
          disabled={saving}
          onClick={() => {
            draftTouchedRef.current = false;
            setDraftByPersonId({});
            dispatch(fetchAttendancesByEvent(eventId));
            setSnackbar('Cambios descartados');
          }}
        >
          Descartar cambios
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Asiste</TableCell>
            <TableCell>Persona</TableCell>
            <TableCell>Observaciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allowedPeople.map((p) => {
            const a = attendanceByPersonId.get(p.id);
            return (
              <TableRow key={p.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={draftByPersonId[p.id]?.present || false}
                    disabled={saving}
                    onChange={(e) => setDraft(p.id, { present: e.target.checked })}
                  />
                </TableCell>
                <TableCell>{personLabel(p)}</TableCell>
                <TableCell sx={{ minWidth: 280 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Observaciones del asistente"
                    value={draftByPersonId[p.id]?.observations || ''}
                    disabled={!draftByPersonId[p.id]?.present || saving}
                    onChange={(e) => setDraft(p.id, { observations: e.target.value })}
                  />
                </TableCell>
              </TableRow>
            );
          })}

          {allowedPeople.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography variant="body2" color="text.secondary">
                  No hay personas elegibles para este evento.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar asistencia</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Vas a guardar cambios para este evento.
          </Typography>

          <Stack spacing={1}>
            <Typography variant="body2">
              Nuevas asistencias: <b>{confirmSummary.toAdd.length}</b>
            </Typography>
            <Typography variant="body2">
              Asistencias a quitar: <b>{confirmSummary.toRemove.length}</b>
            </Typography>
            <Typography variant="body2">
              Observaciones actualizadas: <b>{confirmSummary.toUpdateObs.length}</b>
            </Typography>
          </Stack>

          {confirmSummary.totalChanges === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No hay cambios por guardar.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAll}
            disabled={saving || confirmSummary.totalChanges === 0}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2500}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
