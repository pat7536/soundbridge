/**
 * pages/index.js — Home / Dashboard page
 */
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  return (
    <Layout title="SoundBridge">
      <Dashboard />
    </Layout>
  );
}
