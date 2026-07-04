import { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
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

  // IMPORTANT: use direct access so Vite can statically replace it at build-time.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleInitRef = useRef(false);

  const ensureGoogleInit = () => {
    const google = window.google;

    if (!google?.accounts?.id) {
      // eslint-disable-next-line no-alert
      alert('Google Identity no está cargado');
      return false;
    }

    if (!clientId) {
      // eslint-disable-next-line no-alert
      alert('VITE_GOOGLE_CLIENT_ID no configurado');
      return false;
    }

    if (googleInitRef.current) return true;

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

    googleInitRef.current = true;
    return true;
  };

  const loadGoogleIdentityScript = async () => {
    if (window.google?.accounts?.id) return;

    // Avoid duplicating the script tag.
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      await new Promise((resolve) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', resolve, { once: true });
      });
      return;
    }

    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  };

  useEffect(() => {
    // Preload GIS script + init.
    (async () => {
      await loadGoogleIdentityScript();
      ensureGoogleInit();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const google = window.google;
      const ok = ensureGoogleInit();
      if (!ok) return;

      google.accounts.id.prompt((notification) => {
        // If the prompt is not displayed, show a useful error.
        if (notification?.isNotDisplayed?.()) {
          // eslint-disable-next-line no-alert
          alert(
            `Google Login no se pudo mostrar: ${notification.getNotDisplayedReason?.() || 'unknown'}`,
          );
        }
        if (notification?.isSkippedMoment?.()) {
          // eslint-disable-next-line no-alert
          alert(
            `Google Login fue omitido: ${notification.getSkippedReason?.() || 'unknown'}`,
          );
        }
      });
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
