import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice.js';
import { SidebarNav } from './SidebarNav.jsx';

export function AppLayout({ children }) {
  const user = useSelector(selectCurrentUser);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <SidebarNav user={user} />

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
