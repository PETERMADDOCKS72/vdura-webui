import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Volumes = lazy(() => import('@/pages/Volumes'));
const Pools = lazy(() => import('@/pages/Pools'));
const Hosts = lazy(() => import('@/pages/Hosts'));
const Alerts = lazy(() => import('@/pages/Alerts'));
const Performance = lazy(() => import('@/pages/Performance'));
const System = lazy(() => import('@/pages/System'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="volumes" element={<Volumes />} />
        <Route path="pools" element={<Pools />} />
        <Route path="hosts" element={<Hosts />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="performance" element={<Performance />} />
        <Route path="system" element={<System />} />
      </Route>
    </Routes>
  );
}
