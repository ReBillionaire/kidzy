import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { KidzyProvider, useKidzy } from './context/KidzyContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LandingPage from './components/landing/LandingPage';
import WelcomeScreen from './components/auth/WelcomeScreen';
import LoginScreen from './components/auth/LoginScreen';
import OnboardingTutorial from './components/onboarding/OnboardingTutorial';
import Dashboard from './components/dashboard/Dashboard';
import KidDashboard from './components/dashboard/KidDashboard';
import RewardsPage from './components/rewards/RewardsPage';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import ActivityPage from './components/activity/ActivityPage';
import SettingsPage from './components/settings/SettingsPage';
import BottomNav from './components/shared/BottomNav';

function AppContent() {
  const state = useKidzy();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logic based on auth state
  useEffect(() => {
    if (!state) return;

    const path = location.pathname;
    const isAppRoute = ['/dashboard', '/leaderboard', '/rewards', '/activity', '/settings'].some(r => path.startsWith(r));
    const isAuthRoute = ['/login', '/setup', '/kid-mode'].includes(path);

    // No family → must be on landing or setup
    if (!state.family) {
      if (path !== '/' && path !== '/setup') {
        navigate('/', { replace: true });
      }
      return;
    }

    // Kid mode → kid dashboard
    if (state.kidMode) {
      if (path !== '/kid-mode') {
        navigate('/kid-mode', { replace: true });
      }
      return;
    }

    // Family exists but no logged-in parent → landing or login
    if (!state.currentParentId) {
      if (isAppRoute) {
        navigate('/login', { replace: true });
      }
      return;
    }

    // Logged in but on auth pages → redirect to dashboard
    if (state.currentParentId && (path === '/' || path === '/login' || path === '/setup')) {
      navigate('/dashboard', { replace: true });
    }
  }, [state?.family, state?.currentParentId, state?.kidMode, location.pathname, navigate, state]);

  // When user logs out, redirect
  useEffect(() => {
    if (state?.loggedOut) {
      navigate('/', { replace: true });
    }
  }, [state?.loggedOut, navigate]);

  if (!state) return null;

  const handleGetStarted = () => {
    if (state.family) {
      navigate('/login');
    } else {
      navigate('/setup');
    }
  };

  const handleNavigate = (page, kidId = null) => {
    if (kidId) {
      navigate(`/${page}?kid=${kidId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  const goHome = () => navigate('/dashboard');

  // Wrapper for authenticated pages with bottom nav
  const AuthLayout = ({ children }) => (
    <div className="max-w-lg mx-auto min-h-dvh bg-kidzy-bg relative">
      <ErrorBoundary showDetails>
        {children}
      </ErrorBoundary>
      <BottomNav active={location.pathname.replace('/', '') || 'dashboard'} onNavigate={handleNavigate} />
    </div>
  );

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        !state.family ? (
          <LandingPage onGetStarted={handleGetStarted} />
        ) : !state.currentParentId && !state.kidMode ? (
          <LandingPage onGetStarted={handleGetStarted} />
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/setup" element={
        !state.family ? <WelcomeScreen /> : <Navigate to="/dashboard" replace />
      } />

      <Route path="/login" element={
        state.family && !state.currentParentId && !state.kidMode ? (
          <LoginScreen />
        ) : state.currentParentId ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* Kid mode */}
      <Route path="/kid-mode" element={
        state.kidMode ? (
          <ErrorBoundary showDetails><KidDashboard /></ErrorBoundary>
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* Authenticated app routes */}
      <Route path="/dashboard" element={
        state.currentParentId ? (
          <>
            <AuthLayout>
              <Dashboard onNavigate={handleNavigate} />
            </AuthLayout>
            {!state.onboardingComplete && <OnboardingTutorial />}
          </>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/rewards" element={
        state.currentParentId ? (
          <AuthLayout>
            <RewardsPage onBack={goHome} selectedKidId={new URLSearchParams(location.search).get('kid')} />
          </AuthLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/leaderboard" element={
        state.currentParentId ? (
          <AuthLayout><LeaderboardPage onBack={goHome} /></AuthLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/activity" element={
        state.currentParentId ? (
          <AuthLayout><ActivityPage onBack={goHome} /></AuthLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/settings" element={
        state.currentParentId ? (
          <AuthLayout><SettingsPage onBack={goHome} /></AuthLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Catch-all → redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <KidzyProvider>
        <AppContent />
      </KidzyProvider>
    </ErrorBoundary>
  );
}
