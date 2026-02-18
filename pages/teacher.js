/**
 * pages/teacher.js — Teacher dashboard page
 */
import Layout from '@/components/Layout';
import TeacherPanel from '@/components/TeacherPanel';

export default function TeacherPage() {
  return (
    <Layout title="Teacher Dashboard" showBack>
      <TeacherPanel />
    </Layout>
  );
}
