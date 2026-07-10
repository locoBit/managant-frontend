import { Box } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSessionThunk, selectCurrentUser } from '../auth/authSlice.js';
import { AppLayout } from './AppLayout.jsx';
import LoginPage from '../auth/LoginPage.jsx';
import { RolesPage } from '../roles/RolesPage.jsx';
import { AreasPage } from '../areas/AreasPage.jsx';
import { PeoplePage } from '../people/PeoplePage.jsx';
import { EventsPage } from '../events/EventsPage.jsx';
import { EventAttendancePage } from '../events/EventAttendancePage.jsx';
import { UsersAdminPage } from '../users/UsersAdminPage.jsx';
import { ReportsPage } from '../reports/ReportsPage.jsx';

function hasStoredToken() {
  try {
    return !!window.localStorage.getItem('managant-token');
  } catch {
    return false;
  }
}

function PrivateRoute({ children }) {
  const user = useSelector(selectCurrentUser);
  const restoreStatus = useSelector((s) => s.auth.restoreStatus);

  // If token exists, give restore a chance BEFORE redirecting.
  if (!user && hasStoredToken() && restoreStatus !== 'failed') return null;

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const user = useSelector(selectCurrentUser);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/eventos" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore session from stored token on hard reload.
    dispatch(restoreSessionThunk());
  }, [dispatch]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={(
            <PrivateRoute>
              <AppLayout>
                <Routes>
                  <Route
                    path="roles"
                    element={(
                      <AdminRoute>
                        <RolesPage />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="areas"
                    element={(
                      <AdminRoute>
                        <AreasPage />
                      </AdminRoute>
                    )}
                  />
                  <Route path="personas" element={<PeoplePage />} />
                  <Route path="eventos" element={<EventsPage />} />
                  <Route path="eventos/:eventId/asistencia" element={<EventAttendancePage />} />
                  <Route
                    path="usuarios"
                    element={(
                      <AdminRoute>
                        <UsersAdminPage />
                      </AdminRoute>
                    )}
                  />
                  <Route path="reportes/*" element={<ReportsPage />} />
                  <Route path="*" element={<Navigate to="/roles" replace />} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          )}
        />
      </Routes>
    </Box>
  );
}
