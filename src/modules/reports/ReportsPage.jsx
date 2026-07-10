import { Box, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AreaAttendanceReport } from './AreaAttendanceReport.jsx';

export function ReportsPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reportes
      </Typography>

      <Routes>
        <Route path="asistencias" element={<AreaAttendanceReport />} />
        <Route path="*" element={<Navigate to="asistencias" replace />} />
      </Routes>
    </Box>
  );
}
