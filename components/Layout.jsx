/**
 * Layout.jsx
 * Main application shell — navigation bar + page wrapper.
 */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import FeedbackBanner from '@/components/ui/FeedbackBanner';

export default function Layout({ children, title = 'SoundBridge', showBack = false }) {
  const { teacherMode, setTeacherMode } = useApp();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Back button */}
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Go back"
            >
              ← Back
            </button>
          )}

          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🔤</span>
            <span className="font-bold text-slate-800 text-lg tracking-tight">
              SoundBridge
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Page title */}
          {title !== 'SoundBridge' && (
            <span className="text-sm font-medium text-slate-500 hidden sm:block">
              {title}
            </span>
          )}

          {/* Teacher mode badge */}
          {teacherMode && (
            <Link
              href="/teacher"
              className="flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-amber-800 text-xs font-semibold hover:bg-amber-200 transition-colors"
            >
              <span>👩‍🏫</span>
              <span>Teacher</span>
            </Link>
          )}

          {/* Teacher mode toggle */}
          <button
            onClick={() => setTeacherMode(!teacherMode)}
            className={`p-2 rounded-lg text-sm transition-colors ${
              teacherMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            aria-label={teacherMode ? 'Exit teacher mode' : 'Enter teacher mode'}
            title={teacherMode ? 'Exit teacher mode' : 'Enter teacher mode'}
          >
            {teacherMode ? '🔓' : '🔒'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto flex">
          <NavItem href="/" icon="🏠" label="Home" />
          <NavItem href="/sound-compare" icon="🇪🇸↔️🇺🇸" label="Compare" />
          {teacherMode && <NavItem href="/teacher" icon="👩‍🏫" label="Teacher" />}
        </div>
      </nav>

      {/* Global feedback banner */}
      <FeedbackBanner />
    </div>
  );
}

function NavItem({ href, icon, label }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors
        ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
