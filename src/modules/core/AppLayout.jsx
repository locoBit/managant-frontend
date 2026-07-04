import { Box, Button, Typography, Divider } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../auth/authSlice.js';
import { api } from '../../api/api.js';

export function AppLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  const handleLogout = async () => {
    try {
      if (api.logout) await api.logout();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const isAdminUser = user?.isAdmin;

  const navItems = isAdminUser
    ? [
        { path: '/roles', label: 'Roles' },
        { path: '/areas', label: 'Áreas' },
        { path: '/personas', label: 'Personas' },
        { path: '/eventos', label: 'Eventos' },
        { path: '/usuarios', label: 'Usuarios' },
        { path: '/reportes', label: 'Reportes' },
      ]
    : [
        { path: '/personas', label: 'Personas' },
        { path: '/eventos', label: 'Eventos' },
        { path: '/reportes', label: 'Reportes' },
      ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Sidebar a la izquierda */}
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

        {navItems.map((item) => (
          <Button
            key={item.path}
            component={RouterLink}
            to={item.path}
            variant={isActive(item.path) ? 'contained' : 'text'}
            color={isActive(item.path) ? 'secondary' : 'inherit'}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              color: isActive(item.path) ? 'secondary.contrastText' : 'inherit',
            }}
          >
            {item.label}
          </Button>
        ))}

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

      {/* Contenido principal a la derecha */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
