import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
import { selectCurrentUser } from '../auth/authSlice.js';
import { fetchPeople, selectPeople } from '../people/peopleSlice.js';
import {
  fetchUsers,
  selectUsers,
  selectUsersError,
  upsertUserThunk,
} from './usersSlice.js';

export function UsersAdminPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const users = useSelector(selectUsers);
  const people = useSelector(selectPeople);
  const globalError = useSelector(selectUsersError);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ personId: '', gmail: '', active: true });

  useEffect(() => {
    // Seguridad básica: solo admin puede ver esto.
    if (!currentUser?.isAdmin) return;
    dispatch(fetchUsers());
    dispatch(fetchPeople());
  }, [dispatch, currentUser]);

  const peopleWithUserMap = useMemo(() => {
    const byPerson = new Map();
    users.forEach((u) => {
      byPerson.set(u.personId, u);
    });
    return byPerson;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const person = people.find((p) => p.id === u.personId);
      const name = person
        ? `${person.firstNames} ${person.lastName}`.toLowerCase()
        : '';
      return (
        u.username.toLowerCase().includes(q) ||
        name.includes(q)
      );
    });
  }, [search, users, people]);

  const handleOpenCreate = (personId = '') => {
    setForm({ personId, gmail: '', active: true });
    setFormError('');
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setForm({ personId: user.personId, gmail: user.username, active: user.active !== false });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.personId) {
      setFormError('Selecciona una persona');
      return;
    }
    if (!form.gmail.trim()) {
      setFormError('El correo es obligatorio');
      return;
    }

    const result = await dispatch(
      upsertUserThunk({
        personId: form.personId,
        gmail: form.gmail.trim(),
        active: form.active,
      }),
    );
    if (upsertUserThunk.rejected.match(result)) {
      setFormError(result.payload || result.error.message);
      return;
    }

    setSnackbar('Usuario guardado');
    setDialogOpen(false);
  };

  const getPersonName = (personId) => {
    const p = people.find((x) => x.id === personId);
    return p ? `${p.firstNames} ${p.lastName}` : personId;
  };

  // Por seguridad, en caso de que alguien llegue por URL directa.
  if (!currentUser?.isAdmin) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No tienes permiso para administrar usuarios.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Administración de usuarios
      </Typography>

      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalError}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Buscar por gmail o persona"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="contained" onClick={() => handleOpenCreate('')}>
          Nuevo usuario
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Gmail</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell>Persona</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.active === false ? 'No' : 'Sí'}</TableCell>
              <TableCell>{getPersonName(u.personId)}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleEditUser(u)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Personas sin usuario
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Persona</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {people
            .filter((p) => p.active !== false)
            .filter((p) => !peopleWithUserMap.has(p.id))
            .map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.firstNames} {p.lastName}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpenCreate(p.id)}
                  >
                    Crear usuario
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Usuario de acceso</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel id="person-label">Persona</InputLabel>
            <Select
              labelId="person-label"
              label="Persona"
              value={form.personId}
              onChange={(e) =>
                setForm((f) => ({ ...f, personId: e.target.value }))
              }
            >
              {people.filter((p) => p.active !== false).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.firstNames} {p.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Gmail"
            fullWidth
            margin="normal"
            value={form.gmail}
            onChange={(e) => setForm((f) => ({ ...f, gmail: e.target.value }))}
            autoComplete="email"
            placeholder="usuario@gmail.com"
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
            }
            label="Usuario activo"
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
