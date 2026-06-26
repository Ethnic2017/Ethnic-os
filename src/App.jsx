import { Toaster } from "@/components/ui/toaster"
import { Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Inventaire from './pages/Inventaire';
import ImportInventaire from './pages/ImportInventaire';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.12, ease: 'easeIn' } },
};

// Routes accessibles sans connexion
const PUBLIC_PATHS = ['/login', '/auth/callback'];
const isPublicRoute = (pathname) =>
  PUBLIC_PATHS.includes(pathname) ||
  pathname.toLowerCase().startsWith('/public') ||
  pathname === '/JoinCommunity';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();
  const location = useLocation();

  // Spinner pendant la vérification de session
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Redirection vers login si non authentifié sur une route privée
  if (!isAuthenticated && !isPublicRoute(location.pathname)) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <Page />
                </motion.div>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/ImportInventaire" element={<LayoutWrapper currentPageName="ImportInventaire"><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><ImportInventaire /></motion.div></LayoutWrapper>} />
        <Route path="/Inventaire" element={<LayoutWrapper currentPageName="Inventaire"><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Inventaire /></motion.div></LayoutWrapper>} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App