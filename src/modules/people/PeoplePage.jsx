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
import {
  createPersonThunk,
  fetchPeople,
  selectPeople,
  assignPersonToAreaWithRoleThunk,
  unassignPersonFromAreaWithRoleThunk,
  changePersonRoleInAreaThunk,
  softDeletePersonThunk,
  updatePersonThunk,
} from './peopleSlice.js';
import { fetchAreas, selectAreas } from '../areas/areasSlice.js';
import { fetchRoles, selectRoles } from '../roles/rolesSlice.js';
import { selectCurrentUser } from '../auth/authSlice.js';

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

export function PeoplePage() {
  const dispatch = useDispatch();
  const people = useSelector(selectPeople);
  const areas = useSelector(selectAreas);
  const roles = useSelector(selectRoles);
  const currentUser = useSelector(selectCurrentUser);
  const isAdminUser = currentUser?.isAdmin;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [areasPersonId, setAreasPersonId] = useState(null);
  const [selectedManagedAreaId, setSelectedManagedAreaId] = useState('');
  const [form, setForm] = useState({
    firstNames: '',
    lastName: '',
    motherLastName: '',
    birthDate: '',
    initialRoleId: '',
  });
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchPeople());
    dispatch(fetchAreas());
    dispatch(fetchRoles());
  }, [dispatch]);

  const managedAreas = useMemo(() => {
    if (!currentUser) return [];
    if (isAdminUser) return [];

    // Áreas donde el usuario es responsable o ayudante (raíces)
    const rootManaged = areas.filter(
      (a) =>
        a.responsiblePersonId === currentUser.personId ||
        a.helperPersonId === currentUser.personId,
    );
    if (rootManaged.length === 0) return [];

    // Incluir también todas las sub-áreas de esas raíces
    const allIds = new Set();
    rootManaged.forEach((root) => {
      getAreaDescendants(areas, root.id).forEach((id) => allIds.add(id));
    });

    return areas.filter((a) => allIds.has(a.id));
  }, [areas, currentUser, isAdminUser]);

  useEffect(() => {
    if (!isAdminUser && managedAreas.length > 0 && !selectedManagedAreaId) {
      setSelectedManagedAreaId(managedAreas[0].id);
    }
  }, [isAdminUser, managedAreas, selectedManagedAreaId]);

  const filteredPeople = useMemo(() => {
    let base = people;

    if (!isAdminUser) {
      if (!selectedManagedAreaId) return [];
      const areaIdsInTree = getAreaDescendants(areas, selectedManagedAreaId);
      base = people.filter((p) =>
        (p.areas || []).some((rel) => areaIdsInTree.includes(rel.areaId)),
      );
    }

    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base
      .filter((p) => p.active !== false)
      .filter((p) =>
        `${p.firstNames} ${p.lastName} ${p.motherLastName}`
          .toLowerCase()
          .includes(q),
      );
  }, [search, people, isAdminUser, selectedManagedAreaId, areas]);

  const handleOpen = () => {
    setEditingPerson(null);
    setForm({
      firstNames: '',
      lastName: '',
      motherLastName: '',
      birthDate: '',
      phoneNumber: '',
      initialRoleId: '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (person) => {
    setEditingPerson(person);
    setForm({
      firstNames: person.firstNames,
      lastName: person.lastName,
      motherLastName: person.motherLastName,
      birthDate: person.birthDate,
      initialRoleId: '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstNames.trim() || !form.lastName.trim() || !form.birthDate) {
      setError('Nombre, apellido paterno y fecha de nacimiento son obligatorios');
      return;
    }
    let result;
    if (editingPerson) {
      result = await dispatch(
        updatePersonThunk({
          id: editingPerson.id,
          data: {
            firstNames: form.firstNames.trim(),
            lastName: form.lastName.trim(),
            motherLastName: form.motherLastName.trim(),
            birthDate: form.birthDate,
          },
        }),
      );
      if (updatePersonThunk.rejected.match(result)) {
        setError(result.payload || result.error.message);
        return;
      }
      setSnackbar('Persona actualizada');
    } else {
      result = await dispatch(
        createPersonThunk({
          firstNames: form.firstNames.trim(),
          lastName: form.lastName.trim(),
          motherLastName: form.motherLastName.trim(),
          birthDate: form.birthDate,
          phoneNumber: form.phoneNumber.trim(),
          ...(form.initialRoleId ? { initialRoleId: form.initialRoleId } : {}),
        }),
      );
      if (createPersonThunk.rejected.match(result)) {
        setError(result.payload || result.error.message);
        return;
      }
      setSnackbar('Persona creada');
    }
    setDialogOpen(false);
  };

  const handleOpenAreas = (personId) => {
    setAreasPersonId(personId);
    setAreasDialogOpen(true);
  };

  const handleOpenRolesFromEdit = () => {
    if (!editingPerson?.id) {
      setSnackbar('Primero guarda la persona para poder asignarle roles');
      return;
    }
    // UX simple: cerramos el diálogo de edición y abrimos el de roles/áreas.
    setDialogOpen(false);
    handleOpenAreas(editingPerson.id);
  };

  const handleDeactivate = async (personId) => {
    const ok = window.confirm(
      '¿Desactivar esta persona? No aparecerá en listas actuales, pero se conserva el histórico.',
    );
    if (!ok) return;

    const result = await dispatch(softDeletePersonThunk(personId));
    if (softDeletePersonThunk.rejected.match(result)) {
      setSnackbar(result.payload || result.error.message);
      return;
    }

    setSnackbar('Persona desactivada');
  };

  if (!isAdminUser && managedAreas.length === 0) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No tienes permiso para ver personas.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Personas
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Buscar"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isAdminUser && (
          <Button variant="contained" onClick={handleOpen}>
            Nueva persona
          </Button>
        )}
        {!isAdminUser && managedAreas.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="managed-area-label">Área</InputLabel>
            <Select
              labelId="managed-area-label"
              label="Área"
              value={selectedManagedAreaId}
              onChange={(e) => setSelectedManagedAreaId(e.target.value)}
            >
              {managedAreas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Apellido paterno</TableCell>
            <TableCell>Apellido materno</TableCell>
            <TableCell>Fecha nacimiento</TableCell>
            <TableCell>Teléfono</TableCell>
            {isAdminUser && <TableCell>Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPeople.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.firstNames}</TableCell>
              <TableCell>{p.lastName}</TableCell>
              <TableCell>{p.motherLastName}</TableCell>
              <TableCell>{p.birthDate}</TableCell>
              <TableCell>{p.phoneNumber || ''}</TableCell>
              {isAdminUser && (
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => handleOpenEdit(p)}>
                      Editar
                    </Button>
                    <Button size="small" onClick={() => handleOpenAreas(p.id)}>
                      Áreas
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={p.active === false}
                      onClick={() => handleDeactivate(p.id)}
                    >
                      Desactivar
                    </Button>
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingPerson ? 'Editar persona' : 'Nueva persona'}</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Nombres"
            fullWidth
            margin="normal"
            value={form.firstNames}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstNames: e.target.value }))
            }
          />
          <TextField
            label="Apellido paterno"
            fullWidth
            margin="normal"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          <TextField
            label="Apellido materno"
            fullWidth
            margin="normal"
            value={form.motherLastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, motherLastName: e.target.value }))
            }
          />
          <TextField
            type="date"
            label="Fecha de nacimiento"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.birthDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, birthDate: e.target.value }))
            }
          />

          <TextField
            label="Teléfono"
            fullWidth
            margin="normal"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, phoneNumber: e.target.value }))
            }
          />

          {!editingPerson && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="initial-role-label">Rol inicial</InputLabel>
              <Select
                labelId="initial-role-label"
                label="Rol inicial"
                value={form.initialRoleId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initialRoleId: e.target.value }))
                }
              >
                <MenuItem value="">
                  <em>Sin rol</em>
                </MenuItem>
                {roles
                  .filter((r) => r.active !== false)
                  .map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          {editingPerson && (
            <Button variant="outlined" onClick={handleOpenRolesFromEdit}>
              Asignar rol
            </Button>
          )}
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

      {areasPersonId && (
        <PersonAreasDialog
          open={areasDialogOpen}
          onClose={() => setAreasDialogOpen(false)}
          personId={areasPersonId}
          areas={areas}
          roles={roles}
        />
      )}
    </Box>
  );
}

function PersonAreasDialog({ open, onClose, personId, areas, roles }) {
  const dispatch = useDispatch();
  const people = useSelector(selectPeople);
  const person = people.find((p) => p.id === personId);
  const [form, setForm] = useState({ areaId: '', roleId: '' });
  const [error, setError] = useState('');

  if (!person) return null;

  const memberships = person.areas || [];

  const handleAssign = async () => {
    if (!form.areaId || !form.roleId) {
      setError('Selecciona un área y un rol');
      return;
    }
    const result = await dispatch(
      assignPersonToAreaWithRoleThunk({
        personId,
        areaId: form.areaId,
        roleId: form.roleId,
      }),
    );
    if (assignPersonToAreaWithRoleThunk.rejected.match(result)) {
      setError(result.payload || result.error.message);
      return;
    }
    setForm({ areaId: '', roleId: '' });
    setError('');
  };

  const getAreaName = (id) => {
    const a = areas.find((x) => x.id === id);
    return a ? a.name : id;
  };

  const getRoleName = (id) => {
    const r = roles.find((x) => x.id === id);
    return r ? r.name : id;
  };

  const availableRolesForArea = (areaId) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area) return [];
    if (!area.allowedRoleIds || area.allowedRoleIds.length === 0) return [];
    return roles.filter((r) => area.allowedRoleIds.includes(r.id));
  };

  const rolesForSelectedArea = availableRolesForArea(form.areaId);
  const selectedArea = areas.find((a) => a.id === form.areaId);
  const selectedAreaHasAllowedRoles =
    !form.areaId || (selectedArea?.allowedRoleIds || []).length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Áreas de {person.firstNames} {person.lastName}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Asignaciones actuales
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Área</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memberships.map((m, idx) => {
              const rowRoles = availableRolesForArea(m.areaId);
              return (
                <TableRow key={idx}>
                  <TableCell>{getAreaName(m.areaId)}</TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={m.roleId}
                        onChange={async (e) => {
                          const toRoleId = e.target.value;
                          const result = await dispatch(
                            changePersonRoleInAreaThunk({
                              personId,
                              areaId: m.areaId,
                              fromRoleId: m.roleId,
                              toRoleId,
                            }),
                          );
                          if (changePersonRoleInAreaThunk.rejected.match(result)) {
                            setError(result.payload || result.error.message);
                          } else {
                            setError('');
                          }
                        }}
                      >
                        {rowRoles.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        const ok = window.confirm(
                          '¿Quitar este rol de la persona en esta área?',
                        );
                        if (!ok) return;

                        const result = await dispatch(
                          unassignPersonFromAreaWithRoleThunk({
                            personId,
                            areaId: m.areaId,
                            roleId: m.roleId,
                          }),
                        );
                        if (
                          unassignPersonFromAreaWithRoleThunk.rejected.match(result)
                        ) {
                          setError(result.payload || result.error.message);
                        } else {
                          setError('');
                        }
                      }}
                    >
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {memberships.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    La persona no tiene áreas asignadas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Agregar a un área
        </Typography>

        {form.areaId && !selectedAreaHasAllowedRoles && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta área no tiene roles permitidos configurados. Ve a <b>Áreas</b> y selecciona al menos un rol permitido.
          </Alert>
        )}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="area-label">Área</InputLabel>
            <Select
              labelId="area-label"
              label="Área"
              value={form.areaId}
              onChange={(e) =>
                setForm((f) => ({ ...f, areaId: e.target.value, roleId: '' }))
              }
            >
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            fullWidth
            disabled={!form.areaId || !selectedAreaHasAllowedRoles}
          >
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              label="Rol"
              value={form.roleId}
              onChange={(e) =>
                setForm((f) => ({ ...f, roleId: e.target.value }))
              }
            >
              {rolesForSelectedArea.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!form.areaId || !form.roleId || !selectedAreaHasAllowedRoles}
          >
            Agregar
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
