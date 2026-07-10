import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAreas } from '../areas/areasSlice.js';
import { selectCurrentUser } from '../auth/authSlice.js';
import { api } from '../../api/api.js';

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

export function AreaAttendanceReport() {
  const areas = useSelector(selectAreas);
  const currentUser = useSelector(selectCurrentUser);
  const isAdminUser = currentUser?.isAdmin;

  const managedRoots = useMemo(() => {
    if (!currentUser) return [];

    const activeAreas = areas.filter((a) => a.active !== false);

    // Admin: only show true roots (top-level), not random subareas.
    if (isAdminUser) {
      return activeAreas
        .filter((a) => !a.parentAreaId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const managed = activeAreas.filter(
      (a) =>
        a.responsiblePersonId === currentUser.personId ||
        a.helperPersonId === currentUser.personId,
    );

    const managedIds = new Set(managed.map((a) => a.id));
    const byId = new Map(activeAreas.map((a) => [a.id, a]));

    const hasManagedAncestor = (area) => {
      let cur = area.parentAreaId;
      while (cur) {
        if (managedIds.has(cur)) return true;
        cur = byId.get(cur)?.parentAreaId;
      }
      return false;
    };

    // Only keep areas that are not descendants of another managed area.
    return managed
      .filter((a) => !hasManagedAncestor(a))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [areas, currentUser, isAdminUser]);

  const [rootAreaId, setRootAreaId] = useState('');
  const [subAreaId, setSubAreaId] = useState('');

  const rootHasRealSubareas = useMemo(() => {
    if (!rootAreaId) return false;
    return areas.some((a) => a.parentAreaId === rootAreaId);
  }, [areas, rootAreaId]);

  const effectiveAreaId = rootHasRealSubareas ? subAreaId : rootAreaId;
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const showRootSelector = managedRoots.length > 1;

  useEffect(() => {
    if (!rootAreaId && managedRoots.length > 0) {
      setRootAreaId(managedRoots[0].id);
    }
  }, [managedRoots, rootAreaId]);

  const selectableSubareas = useMemo(() => {
    if (!rootAreaId) return [];
    const ids = getAreaDescendants(areas, rootAreaId);

    // only true subareas (exclude root itself)
    return areas.filter((a) => ids.includes(a.id) && a.id !== rootAreaId);
  }, [areas, rootAreaId]);

  useEffect(() => {
    if (!rootHasRealSubareas) {
      // no subarea select needed
      setSubAreaId('');
      return;
    }

    // has subareas: auto-pick first subarea
    if (!subAreaId && selectableSubareas.length > 0) {
      setSubAreaId(selectableSubareas[0].id);
    }
  }, [rootHasRealSubareas, subAreaId, selectableSubareas]);

  const fetchReport = async () => {
    if (!effectiveAreaId) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.getAreaAttendanceReport({
        areaId: effectiveAreaId,
        start: start || undefined,
        end: end || undefined,
      });
      setReport(res);
    } catch (e) {
      setError(e.message || 'Error al cargar reporte');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAreaId, start, end]);

  const rows = report?.rows || [];

  const avgPct = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + (r.percentage || 0), 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  const rootAreaName = useMemo(() => {
    return areas.find((a) => a.id === rootAreaId)?.name || '';
  }, [areas, rootAreaId]);

  const selectedAreaName = useMemo(() => {
    return areas.find((a) => a.id === effectiveAreaId)?.name || '';
  }, [areas, effectiveAreaId]);

  const totalEvents = report?.totalEvents || '0';

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Asistencias
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {showRootSelector ? (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="root-area-label">Área raíz</InputLabel>
            <Select
              labelId="root-area-label"
              label="Área raíz"
              value={rootAreaId}
              onChange={(e) => {
                setRootAreaId(e.target.value);
                setSubAreaId('');
                setReport(null);
              }}
            >
              {managedRoots.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Box sx={{ minWidth: 220 }} />
        )}

        {rootHasRealSubareas && (
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={!rootAreaId}>
            <InputLabel id="sub-area-label">Subárea</InputLabel>
            <Select
              labelId="sub-area-label"
              label="Subárea"
              value={subAreaId}
              onChange={(e) => setSubAreaId(e.target.value)}
            >
              <MenuItem value="">
                <em>Selecciona subárea</em>
              </MenuItem>
              {selectableSubareas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          size="small"
          type="date"
          label="Inicio"
          InputLabelProps={{ shrink: true }}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          disabled={!effectiveAreaId}
        />
        <TextField
          size="small"
          type="date"
          label="Fin"
          InputLabelProps={{ shrink: true }}
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          disabled={!effectiveAreaId}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {rootHasRealSubareas && !subAreaId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona una subárea para ver el reporte.
        </Alert>
      )}

      {effectiveAreaId && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2">
              {rootHasRealSubareas ? 'Subárea' : 'Área'}
            </Typography>
            <Typography variant="h6">{selectedAreaName}</Typography>
            {rootHasRealSubareas && rootAreaName && (
              <Typography variant="caption" color="text.secondary">
                Raíz: {rootAreaName}
              </Typography>
            )}
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2">Eventos (periodo)</Typography>
            <Typography variant="h6">{totalEvents}</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2">Promedio asistencia</Typography>
            <Typography variant="h6">{avgPct}%</Typography>
          </Paper>
        </Stack>
      )}

      {effectiveAreaId && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Integrantes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Ordenado por % asistencia. Incluye solo eventos del área seleccionada.
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Integrante</TableCell>
                <TableCell align="right">Asistencias</TableCell>
                <TableCell align="right">%</TableCell>
                <TableCell>Última asistencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.personId}>
                  <TableCell>{r.fullName}</TableCell>
                  <TableCell align="right">{r.fraction}</TableCell>
                  <TableCell align="right">{r.percentage}%</TableCell>
                  <TableCell>{r.lastAttendedAt || '-'}</TableCell>
                </TableRow>
              ))}
              {(!loading && rows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sin integrantes o sin eventos en el periodo.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
