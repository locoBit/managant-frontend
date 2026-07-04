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
  Switch,
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
  createRoleThunk,
  deleteRoleThunk,
  fetchRoles,
  selectRoles,
  selectRolesStatus,
  updateRoleThunk,
} from './rolesSlice.js';
import { selectCurrentUser } from '../auth/authSlice.js';

export function RolesPage() {
  const dispatch = useDispatch();
  const roles = useSelector(selectRoles);
  const status = useSelector(selectRolesStatus);
  const currentUser = useSelector(selectCurrentUser);
  const isAdminUser = currentUser?.isAdmin;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({ name: '', scope: 'GLOBAL', maxPeople: 0 });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRoles());
    }
  }, [status, dispatch]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      r.name.toLowerCase().includes(q) || r.scope.toLowerCase().includes(q),
    );
  }, [search, roles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setForm({ name: '', scope: 'GLOBAL', maxPeople: 0 });
    setError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      scope: role.scope,
      maxPeople: role.maxPeople,
      active: role.active,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
      if (!form.scope) {
        setError('El alcance es obligatorio');
        return;
      }
      const maxPeople = Number(form.maxPeople) || 0;
      if (maxPeople <= 0) {
        setError('El máximo de personas debe ser mayor que cero');
        return;
      }

      if (editingRole) {
        const result = await dispatch(
          updateRoleThunk({
            id: editingRole.id,
            data: {
              name: form.name.trim(),
              scope: form.scope,
              maxPeople,
              active:
                typeof form.active === 'boolean' ? form.active : editingRole.active,
            },
          }),
        );
        if (updateRoleThunk.rejected.match(result)) {
          setError(result.payload || result.error.message);
          return;
        }
        setSnackbar('Rol actualizado');
      } else {
        const result = await dispatch(
          createRoleThunk({
            name: form.name.trim(),
            scope: form.scope,
            maxPeople,
          }),
        );
        if (createRoleThunk.rejected.match(result)) {
          setError(result.payload || result.error.message);
          return;
        }
        setSnackbar('Rol creado');
      }
      setDialogOpen(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    const result = await dispatch(deleteRoleThunk(id));
    if (deleteRoleThunk.rejected.match(result)) {
      setSnackbar(result.payload || result.error.message);
    } else {
      setSnackbar('Rol eliminado');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Roles
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Buscar"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isAdminUser && (
          <Button variant="contained" onClick={handleOpenCreate}>
            Nuevo rol
          </Button>
        )}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Alcance</TableCell>
            <TableCell>Máx. personas</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRoles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.scope}</TableCell>
              <TableCell>{role.maxPeople}</TableCell>
              <TableCell>{role.active ? 'Sí' : 'No'}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => handleOpenEdit(role)}>
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(role.id)}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingRole ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="scope-label">Alcance</InputLabel>
            <Select
              labelId="scope-label"
              label="Alcance"
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({ ...f, scope: e.target.value }))
              }
            >
              <MenuItem value="GLOBAL">GLOBAL</MenuItem>
              <MenuItem value="AREA">AREA</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Máximo de personas"
            type="number"
            fullWidth
            margin="normal"
            value={form.maxPeople}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxPeople: Number(e.target.value) }))
            }
          />
          {editingRole && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Typography>Activo</Typography>
              <Switch
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
            </Stack>
          )}
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
