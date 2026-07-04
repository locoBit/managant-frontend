import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice.js';
import { fetchAreas, selectAreas } from '../areas/areasSlice.js';
import { fetchPeople, selectPeople } from '../people/peopleSlice.js';
import { fetchEvents, selectEvents } from '../events/eventsSlice.js';

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

export function ReportsPage() {
  const dispatch = useDispatch();
  const areas = useSelector(selectAreas);
  const people = useSelector(selectPeople);
  const events = useSelector(selectEvents);
  const currentUser = useSelector(selectCurrentUser);
  const isAdminUser = currentUser?.isAdmin;

  const [selectedRootAreaId, setSelectedRootAreaId] = useState('');

  useEffect(() => {
    dispatch(fetchAreas());
    dispatch(fetchPeople());
    dispatch(fetchEvents());
  }, [dispatch]);

  // Áreas que el usuario puede elegir como raíz del reporte
  const selectableAreas = useMemo(() => {
    if (!currentUser) return [];
    if (isAdminUser) return areas;

    const managed = new Set();

    // Responsable o ayudante de área
    areas.forEach((a) => {
      if (
        a.responsiblePersonId === currentUser.personId ||
        a.helperPersonId === currentUser.personId
      ) {
        managed.add(a.id);
      }
    });

    return areas.filter((a) => managed.has(a.id));
  }, [areas, currentUser, isAdminUser]);

  // Auto-selección de raíz
  useEffect(() => {
    if (!selectedRootAreaId && selectableAreas.length > 0) {
      setSelectedRootAreaId(selectableAreas[0].id);
    }
  }, [selectableAreas, selectedRootAreaId]);

  const areaIdsInTree = useMemo(() => {
    if (!selectedRootAreaId) return [];
    return getAreaDescendants(areas, selectedRootAreaId);
  }, [areas, selectedRootAreaId]);

  const peopleInTree = useMemo(() => {
    if (areaIdsInTree.length === 0) return [];
    return people.filter((p) =>
      p.active !== false &&
      (p.areas || []).some((rel) => areaIdsInTree.includes(rel.areaId)),
    );
  }, [people, areaIdsInTree]);

  const eventsInTree = useMemo(() => {
    if (areaIdsInTree.length === 0) return [];
    return events.filter((e) => areaIdsInTree.includes(e.areaId));
  }, [events, areaIdsInTree]);

  const peopleByArea = useMemo(() => {
    const map = new Map();
    peopleInTree.forEach((p) => {
      (p.areas || []).forEach((rel) => {
        if (!areaIdsInTree.includes(rel.areaId)) return;
        const list = map.get(rel.areaId) || [];
        list.push(p);
        map.set(rel.areaId, list);
      });
    });
    return map;
  }, [peopleInTree, areaIdsInTree]);

  const eventsByArea = useMemo(() => {
    const map = new Map();
    eventsInTree.forEach((e) => {
      const list = map.get(e.areaId) || [];
      list.push(e);
      map.set(e.areaId, list);
    });
    return map;
  }, [eventsInTree]);

  const rootArea = areas.find((a) => a.id === selectedRootAreaId);

  if (!currentUser) {
    return null;
  }

  if (!isAdminUser && selectableAreas.length === 0) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No tienes permisos para ver reportes.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportes por área
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="root-area-label">Área raíz</InputLabel>
          <Select
            labelId="root-area-label"
            label="Área raíz"
            value={selectedRootAreaId}
            onChange={(e) => setSelectedRootAreaId(e.target.value)}
          >
            {selectableAreas.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {rootArea && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Área seleccionada: {rootArea.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Incluye todas las subáreas de esta rama.
          </Typography>
        </Box>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Resumen de personas
          </Typography>
          <Typography variant="h6">
            {peopleInTree.length} personas en esta rama
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Resumen de eventos
          </Typography>
          <Typography variant="h6">
            {eventsInTree.length} eventos en esta rama
          </Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Personas por área
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Área</TableCell>
              <TableCell align="right"># Personas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {areaIdsInTree.map((areaId) => {
              const area = areas.find((a) => a.id === areaId);
              if (!area) return null;
              const list = peopleByArea.get(areaId) || [];
              return (
                <TableRow key={areaId}>
                  <TableCell>{area.name}</TableCell>
                  <TableCell align="right">{list.length}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Eventos por área
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Área</TableCell>
              <TableCell align="right"># Eventos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {areaIdsInTree.map((areaId) => {
              const area = areas.find((a) => a.id === areaId);
              if (!area) return null;
              const list = eventsByArea.get(areaId) || [];
              return (
                <TableRow key={areaId}>
                  <TableCell>{area.name}</TableCell>
                  <TableCell align="right">{list.length}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
