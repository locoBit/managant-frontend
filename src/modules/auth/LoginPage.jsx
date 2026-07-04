import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginThunk, selectAuthError, selectAuthStatus } from './authSlice.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleLogin = async () => {
    // Google Identity Services script loads window.google
    const google = window.google;
    if (!google?.accounts?.id) {
      // eslint-disable-next-line no-alert
      alert('Google Identity no está cargado');
      return;
    }

    if (!clientId) {
      // eslint-disable-next-line no-alert
      alert('VITE_GOOGLE_CLIENT_ID no configurado');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const idToken = response?.credential;
          const result = await dispatch(loginThunk({ idToken }));
          if (loginThunk.fulfilled.match(result)) {
            navigate('/roles');
          }
        },
      });

      // Show One Tap / prompt.
      google.accounts.id.prompt();
    } catch {
      // eslint-disable-next-line no-alert
      alert('No se pudo iniciar Google Login');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card sx={{ minWidth: 320 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Iniciar sesión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            disabled={status === 'loading'}
            sx={{ mt: 2 }}
            onClick={handleGoogleLogin}
          >
            {status === 'loading' ? 'Ingresando…' : 'Entrar con Google'}
          </Button>

        </CardContent>
      </Card>
    </Box>
  );
}
