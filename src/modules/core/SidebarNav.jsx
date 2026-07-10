import {
  Box,
  Button,
  Collapse,
  Divider,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../auth/authSlice.js';
import { api } from '../../api/api.js';
import { useMemo, useState } from 'react';

function NavButton({ to, label, active, indent = 0 }) {
  return (
    <Button
      component={RouterLink}
      to={to}
      variant={active ? 'contained' : 'text'}
      color={active ? 'secondary' : 'inherit'}
      fullWidth
      sx={{
        justifyContent: 'flex-start',
        color: active ? 'secondary.contrastText' : 'inherit',
        pl: 2 + indent,
      }}
    >
      {label}
    </Button>
  );
}

export function SidebarNav({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminUser = user?.isAdmin;

  const baseItems = useMemo(() => {
    if (isAdminUser) {
      return [
        { path: '/roles', label: 'Roles' },
        { path: '/areas', label: 'Áreas' },
        { path: '/personas', label: 'Personas' },
        { path: '/eventos', label: 'Eventos' },
        { path: '/usuarios', label: 'Usuarios' },
      ];
    }

    return [
      { path: '/personas', label: 'Personas' },
      { path: '/eventos', label: 'Eventos' },
    ];
  }, [isAdminUser]);

  const reportsOpenDefault = location.pathname.startsWith('/reportes');
  const [reportsOpen, setReportsOpen] = useState(reportsOpenDefault);

  const handleLogout = async () => {
    try {
      if (api.logout) await api.logout();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Managant
      </Typography>

      {baseItems.map((item) => (
        <NavButton
          key={item.path}
          to={item.path}
          label={item.label}
          active={isActive(item.path)}
        />
      ))}

      {/* Reports group */}
      <Button
        onClick={() => setReportsOpen((v) => !v)}
        variant={reportsOpen ? 'contained' : 'text'}
        color={reportsOpen ? 'secondary' : 'inherit'}
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          color: reportsOpen ? 'secondary.contrastText' : 'inherit',
        }}
      >
        Reportes
      </Button>

      <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
          <NavButton
            to="/reportes/asistencias"
            label="Asistencias"
            active={isActive('/reportes/asistencias')}
            indent={2}
          />
        </Box>
      </Collapse>

      <Box sx={{ flexGrow: 1 }} />

      {user && (
        <>
          <Divider sx={{ mb: 1, borderColor: 'primary.light' }} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            {user.name} ({user.username})
          </Typography>
          <Button variant="outlined" color="inherit" onClick={handleLogout}>
            Salir
          </Button>
        </>
      )}
    </Box>
  );
}
