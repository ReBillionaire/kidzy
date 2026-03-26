import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { KidzyProvider, useKidzy } from './context/KidzyContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import WelcomeScreen from './components/auth/WelcomeScreen';
import LoginScreen from './components/auth/LoginScreen';
import FamilyPicker from './components/auth/FamilyPicker';
import OnboardingTutorial from './components/onboarding/OnboardingTutorial';
import Dashboard from './components/dashboard/Dashboard';
import RewardsPage from './components/rewards/RewardsPage';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import ActivityPage from './components/activity/ActivityPage';
import SettingsPage from './components/settings/SettingsPage';
import BottomNav from './components/shared/BottomNav';

// ── Auth Gate ───────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading, families, currentFamilyId, isConfigured } = useAuth();

  // Loading spinner while Firebase checks auth
  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">&#11088;</div>
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Not configured — show fallback message
  if (!isConfigured) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md text-center">
          <div className="text-5xl mb-4">&#11088;</div>
          <h1 className="text-3xl font-display font-bold text-kidzy-dark mb-2">Kidzy</h1>
          <p className="text-kidzy-gray">Firebase is not configured. Add VITE_FIREBASE_* environment variables to enable authentication.</p>
        </div>
      </div>
    );
  }

  // Not logged in — show welcome/auth screen
  if (!user) {
    return <WelcomeScreen />;
  }

  // Logged in but no families — show welcome (create/join)
  if (families.length === 0) {
    return <WelcomeScreen />;
  }

  // Multiple families and none selected — show picker
  if (families.length > 1 && !currentFamilyId) {
    return <FamilyPicker />;
  }

  // Family selected — load family data
  return (
    <KidzyProvider>
      <FamilyApp />
    </KidzyProvider>
  );
}

// ── Family App (post-auth, family loaded) ───────────────────────────
function FamilyApp() {
  const state = useKidzy();
  const [page, setPage] = useState('dashboard');
  const [selectedKidId, setSelectedKidId] = useState(null);

  // No family data loaded yet
  if (!state?.family) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/80 text-sm">Loading family data...</p>
        </div>
      </div>
    );
  }

  // No parent logged in — show parent/kid picker
  if (!state.currentParentId && !state.kidMode) {
    return <LoginScreen />;
  }

  // Show onboarding for first-time users
  if (!state.onboardingComplete && !state.kidMode) {
    return (
      <>
        <div className="max-w-lg mx-auto min-h-dvh bg-kidzy-bg relative">
          <Dashboard onNavigate={() => {}} />
          <BottomNav active="dashboard" onNavigate={() => {}} />
        </div>
        <OnboardingTutorial />
      </>
    );
  }

  const navigate = (newPage, kidId = null) => {
    setPage(newPage);
    if (kidId) setSelectedKidId(kidId);
  };

  const goHome = () => {
    setPage('dashboard');
    setSelectedKidId(null);
  };

  return (
    <div className="max-w-lg mx-auto min-h-dvh bg-kidzy-bg relative">
      <ErrorBoundary showDetails>
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'rewards' && <RewardsPage onBack={goHome} selectedKidId={selectedKidId} />}
        {page === 'leaderboard' && <LeaderboardPage onBack={goHome} />}
        {page === 'activity' && <ActivityPage onBack={goHome} />}
        {page === 'settings' && <SettingsPage onBack={goHome} />}
      </ErrorBoundary>
      <BottomNav active={page} onNavigate={navigate} />
    </div>
  );
}

// ── Root App ────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
