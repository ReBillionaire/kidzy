import { useState } from 'react';
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
  const [page, setPage] = useState('dashboard');
  const [selectedKidId, setSelectedKidId] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  // No family yet -> Landing Page or Setup Flow
  if (!state?.family) {
    if (showSetup) {
      return <WelcomeScreen />;
    }
    return <LandingPage onGetStarted={() => setShowSetup(true)} />;
  }

  // Kid Mode — read-only dashboard for the child
  if (state.kidMode) {
    return <ErrorBoundary showDetails><KidDashboard /></ErrorBoundary>;
  }

  // Family exists but no logged-in parent -> Login
  if (!state.currentParentId) {
    return <LoginScreen />;
  }

  // Show onboarding tutorial for first-time users
  if (!state.onboardingComplete) {
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

export default function App() {
  return (
    <ErrorBoundary>
      <KidzyProvider>
        <AppContent />
      </KidzyProvider>
    </ErrorBoundary>
  );
}
