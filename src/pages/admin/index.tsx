import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import MerchantManagement from './MerchantManagement';
import RoleManagement from './RoleManagement';
import GlobalSettings from './GlobalSettings';
import AuditLogs from './AuditLogs';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/merchants" element={<MerchantManagement />} />
      <Route path="/users" element={<RoleManagement />} />
      <Route path="/roles" element={<RoleManagement />} />
      <Route path="/settings" element={<GlobalSettings />} />
      <Route path="/audit-logs" element={<AuditLogs />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}