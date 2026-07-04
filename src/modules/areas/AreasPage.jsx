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
import { fetchRoles, selectRoles } from '../roles/rolesSlice.js';
import { PersonSearchSelect } from '../shared/PersonSearchSelect.jsx';
import { selectCurrentUser } from '../auth/authSlice.js';
import {
  createAreaCategoryThunk,
  createAreaThunk,
  updateAreaThunk,
  fetchAreaCategories,
  fetchAreas,
  selectAreaCategories,
  selectAreas,
} from './areasSlice.js';

export function AreasPage() {
  const dispatch = useDispatch();
  const areas = useSelector(selectAreas);
  const categories = useSelector(selectAreaCategories);
  const roles = useSelector(selectRoles);
  const currentUser = useSelector(selectCurrentUser);
  const isAdminUser = currentUser?.isAdmin;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    parentAreaId: '',
    responsiblePersonId: '',
    helperPersonId: '',
    allowedRoleIds: [],
  });

  useEffect(() => {
    dispatch(fetchAreas());
    dispatch(fetchAreaCategories());
    // NOTE: we no longer need to load all people just to pick responsible/helper.
    // People page still loads them for CRUD.
    // dispatch(fetchPeople());
    dispatch(fetchRoles());
  }, [dispatch]);

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [search, areas]);

  const handleOpenCreate = () => {
    setEditingArea(null);
    setForm({
      name: '',
      categoryId: '',
      parentAreaId: '',
      responsiblePersonId: '',
      helperPersonId: '',
      allowedRoleIds: [],
    });
    setError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (area) => {
    setEditingArea(area);
    setForm({
      name: area.name || '',
      categoryId: area.categoryId || '',
      parentAreaId: area.parentAreaId || '',
      responsiblePersonId: area.responsiblePersonId || '',
      helperPersonId: area.helperPersonId || '',
      allowedRoleIds: area.allowedRoleIds || [],
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    try {
      if (!form.name.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
      if (!form.responsiblePersonId) {
        setError('Debes seleccionar un responsable');
        return;
      }
      if (form.helperPersonId && form.helperPersonId === form.responsiblePersonId) {
        setError('El ayudante no puede ser la misma persona que el responsable');
        return;
      }
      if (!Array.isArray(form.allowedRoleIds) || form.allowedRoleIds.length === 0) {
        setError('Debes seleccionar al menos un rol permitido');
        return;
      }
      const payload = {
        ...form,
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        parentAreaId: form.parentAreaId || null,
        responsiblePersonId: form.responsiblePersonId || null,
        helperPersonId: form.helperPersonId || null,
      };

      let result;
      if (editingArea) {
        result = await dispatch(
          updateAreaThunk({ id: editingArea.id, data: payload }),
        );
        if (updateAreaThunk.rejected.match(result)) {
          const msg = result.payload || result.error.message;
          setError(msg);
          setSnackbar(msg);
          return;
        }
        setSnackbar('Área actualizada');
      } else {
        result = await dispatch(createAreaThunk(payload));
        if (createAreaThunk.rejected.match(result)) {
          const msg = result.payload || result.error.message;
          setError(msg);
          setSnackbar(msg);
          return;
        }
        setSnackbar('Área creada');
      }
      setDialogOpen(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      setCategoryError('El nombre de la categoría es obligatorio');
      return;
    }
    const result = await dispatch(createAreaCategoryThunk({ name }));
    if (createAreaCategoryThunk.rejected.match(result)) {
      setCategoryError(result.payload || result.error.message);
      return;
    }
    setSnackbar('Categoría creada');
    setCategoryDialogOpen(false);
    setCategoryName('');
    setCategoryError('');
  };

  // Todas las áreas disponibles para usar como padre.
  // Si estamos editando, excluimos el área actual para evitar que sea su propio padre.
  const parentAreaOptions = useMemo(
    () =>
      areas.filter((a) => !editingArea || a.id !== editingArea.id),
    [areas, editingArea],
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Áreas
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
            Nueva área
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => {
            setCategoryName('');
            setCategoryError('');
            setCategoryDialogOpen(true);
          }}
        >
          Nueva categoría
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Área padre</TableCell>
            <TableCell>Responsable</TableCell>
            <TableCell>Ayudante</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAreas.map((area) => {
            const category = categories.find((c) => c.id === area.categoryId);
            const parent = areas.find((a) => a.id === area.parentAreaId);
            const responsibleName = area.responsibleName;
            const helperName = area.helperName;
            return (
              <TableRow key={area.id}>
                <TableCell>{area.name}</TableCell>
                <TableCell>{category ? category.name : '-'}</TableCell>
                <TableCell>{parent ? parent.name : '-'}</TableCell>
                <TableCell>{responsibleName || '-'}</TableCell>
                <TableCell>{helperName || '-'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleOpenEdit(area)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editingArea ? 'Editar área' : 'Nueva área'}</DialogTitle>
          <DialogContent sx={{ minWidth: 500 }}>
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
            <InputLabel id="category-label">Categoría</InputLabel>
            <Select
              labelId="category-label"
              label="Categoría"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>Sin categoría</em>
              </MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="parent-label">Área padre</InputLabel>
            <Select
              labelId="parent-label"
              label="Área padre"
              value={form.parentAreaId}
              onChange={(e) =>
                setForm((f) => ({ ...f, parentAreaId: e.target.value }))
              }
            >
              <MenuItem value="">
                <em>Ninguna (raíz)</em>
              </MenuItem>
              {parentAreaOptions.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <PersonSearchSelect
            label="Responsable"
            value={form.responsiblePersonId}
            valueLabel={editingArea?.responsibleName || ''}
            onChange={(nextResponsiblePersonId) =>
              setForm((f) => ({
                ...f,
                responsiblePersonId: nextResponsiblePersonId,
                helperPersonId:
                  f.helperPersonId === nextResponsiblePersonId
                    ? ''
                    : f.helperPersonId,
              }))
            }
            helperText="Escribe al menos 2 letras"
          />

          <PersonSearchSelect
            label="Ayudante"
            value={form.helperPersonId}
            valueLabel={editingArea?.helperName || ''}
            onChange={(id) => setForm((f) => ({ ...f, helperPersonId: id }))}
            helperText="Escribe al menos 2 letras (opcional)"
            excludePersonId={form.responsiblePersonId}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="roles-label">Roles permitidos</InputLabel>
            <Select
              labelId="roles-label"
              label="Roles permitidos"
              value={form.allowedRoleIds}
              multiple
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => ({
                  ...f,
                  allowedRoleIds: Array.isArray(value) ? value : [value],
                }));
              }}
            >
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" type="submit">
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
      >
        <DialogTitle>Nueva categoría de área</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {categoryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {categoryError}
            </Alert>
          )}
          <TextField
            label="Nombre de categoría"
            fullWidth
            margin="normal"
            autoFocus
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateCategory}>
            Crear
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

