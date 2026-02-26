import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Volumes = lazy(() => import('@/pages/Volumes'));
const Pools = lazy(() => import('@/pages/Pools'));
const Nodes = lazy(() => import('@/pages/Nodes'));
const Help = lazy(() => import('@/pages/Help'));
const About = lazy(() => import('@/pages/About'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="volumes" element={<Volumes />} />
        <Route path="pools" element={<Pools />} />
        <Route path="nodes" element={<Nodes />} />
        <Route path="help" element={<Help />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
