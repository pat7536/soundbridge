/**
 * pages/_app.js — App wrapper with global providers
 */
import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';

export default function App({ Component, pageProps }) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}
