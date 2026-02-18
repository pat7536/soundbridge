/**
 * pages/sound-compare.js — Spanish–English Sound Compare module
 */
import Layout from '@/components/Layout';
import SoundCompare from '@/components/activities/SoundCompare';
import { useRouter } from 'next/router';

export default function SoundComparePage() {
  const router = useRouter();

  return (
    <Layout title="Sound Compare" showBack>
      <div className="max-w-lg mx-auto">
        <SoundCompare
          onComplete={(stars) => {
            setTimeout(() => router.push('/'), 1500);
          }}
        />
      </div>
    </Layout>
  );
}
