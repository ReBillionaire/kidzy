import { useState, useEffect, useMemo, useRef } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { verifyPin, hashPin, isLockedOut, recordFailedAttempt, resetLockout } from '../../utils/storage';
import { getKidBalance, getStreak } from '../../utils/helpers';
import { playClickSound, playCoinSound } from '../../utils/sounds';
import Avatar from '../shared/Avatar';
import { Lock, LogIn, ShieldAlert, ArrowLeft, KeyRound, AlertTriangle, Home, Sparkles, Star, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fun greetings that rotate for kids
const KID_GREETINGS = [
  "Who's ready to be awesome?",
  "Choose your player!",
  "Time to earn some K$!",
  "Let's get started, superstar!",
  "Ready to crush it today?",
  "Your adventure awaits!",
];

// Background colors for kid cards — each kid gets a unique colorful gradient
const KID_CARD_THEMES = [
  { bg: 'from-violet-500 to-purple-600', glow: 'shadow-violet-300/50', accent: '#8B5CF6', ring: 'ring-violet-400' },
  { bg: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-300/50', accent: '#06B6D4', ring: 'ring-cyan-400' },
  { bg: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-300/50', accent: '#10B981', ring: 'ring-emerald-400' },
  { bg: 'from-orange-500 to-amber-600', glow: 'shadow-orange-300/50', accent: '#F97316', ring: 'ring-orange-400' },
  { bg: 'from-pink-500 to-rose-600', glow: 'shadow-pink-300/50', accent: '#EC4899', ring: 'ring-pink-400' },
  { bg: 'from-teal-500 to-cyan-600', glow: 'shadow-teal-300/50', accent: '#14B8A6', ring: 'ring-teal-400' },
];

function FloatingStars() {
  const stars = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 16 + 8}px`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
      emoji: ['\u{2B50}', '\u{2728}', '\u{1F31F}', '\u{26A1}'][Math.floor(Math.random() * 4)],
    }))
  , []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute text-white/20 animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            fontSize: star.fontSize,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration,
          }}
        >
          {star.emoji}
        </div>
      ))}
    </div>
  );
}

// Animated kid character card — the hero of the redesign
function KidCharacterCard({ kid, theme, index, balance, streak, onSelect, isSelected }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => {
        playClickSound();
        onSelect(kid.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full rounded-3xl overflow-hidden transition-all duration-300 text-left
        ${isSelected ? `scale-105 shadow-2xl ${theme.glow} ring-4 ${theme.ring}` : 'shadow-lg hover:shadow-xl hover:scale-[1.02]'}
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Card background gradient */}
      <div className={`bg-gradient-to-br ${theme.bg} p-5`}>
        {/* Decorative sparkles */}
        {(isHovered || isSelected) && (
          <div className="absolute top-2 right-2 animate-bounce-in">
            <Sparkles size={20} className="text-white/60" />
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Avatar with glow ring */}
          <div className={`relative transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
            <div className="absolute -inset-1.5 bg-white/20 rounded-full blur-sm" />
            <Avatar src={kid.avatar} name={kid.name} size="lg" className="relative z-10" />
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
              {Math.min(Math.floor(balance / 10) + 1, 99)}
            </div>
          </div>

          {/* Name and stats */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-display font-bold text-xl truncate">{kid.name}</p>
            {kid.age && (
              <p className="text-white/70 text-xs font-medium">Age {kid.age}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {/* K$ Balance */}
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                <span className="text-yellow-300 text-xs">{'\u{1F4B0}'}</span>
                <span className="text-white font-bold text-xs">{balance} K$</span>
              </div>
              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Flame size={12} className="text-orange-300" />
                  <span className="text-white font-bold text-xs">{streak}</span>
                </div>
              )}
            </div>
          </div>

          {/* Play arrow */}
          <div className={`w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${isHovered ? 'bg-white/40 scale-110' : ''}`}>
            <span className="text-white text-2xl ml-0.5">{'\u{25B6}'}</span>
          </div>
        </div>
      </div>

      {/* Bottom shine effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </button>
  );
}

export default function LoginScreen() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null = selector, 'parent', 'kid'
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState(state.parents[0]?.id || null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [resetFamilyName, setResetFamilyName] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [greeting] = useState(() => KID_GREETINGS[Math.floor(Math.random() * KID_GREETINGS.length)]);
  const [selectedKid, setSelectedKid] = useState(null);
  const selectTimerRef = useRef(null);

  const hasPIN = state.family?.pin && state.family.pin.length > 0;

  // Check lockout on mount and tick every second
  useEffect(() => {
    const check = () => {
      const seconds = isLockedOut();
      setLockoutSeconds(seconds || 0);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    if (lockoutSeconds > 0) return;

    // No PIN set — just log in directly
    if (!hasPIN) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: selectedParent || state.parents[0]?.id });
      return;
    }

    const isValid = await verifyPin(pin, state.family.pin);
    if (isValid) {
      // Auto-migrate plaintext PIN to hashed
      if (state.family.pin.length < 10) {
        const hashed = await hashPin(pin);
        dispatch({ type: 'LOAD_DATA', payload: { ...state, family: { ...state.family, pin: hashed } } });
      }
      dispatch({ type: 'SET_CURRENT_PARENT', payload: selectedParent || state.parents[0]?.id });
      setError('');
      resetLockout();
    } else {
      const lockState = recordFailedAttempt();
      if (lockState.attempts >= 5) {
        setError(`Too many attempts. Locked for ${Math.ceil((lockState.lockedUntil - Date.now()) / 1000)}s`);
      } else {
        setError(`Wrong PIN. ${5 - lockState.attempts} attempts remaining.`);
      }
      setPin('');
    }
  };

  const handleKidSelect = (kidId) => {
    setSelectedKid(kidId);
    playCoinSound();
    // Small delay for the selection animation to play before transitioning
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_KID_MODE', payload: kidId });
    }, 400);
  };

  const handleForgotPinReset = () => {
    const inputName = resetFamilyName.trim().toLowerCase();
    const actualName = state.family?.name?.trim().toLowerCase() || '';

    if (inputName !== actualName) {
      setResetError('Incorrect family name. Please try again.');
      return;
    }

    // Verified! Clear the PIN and show success message
    dispatch({ type: 'SET_FAMILY_PIN', payload: null });
    setResetSuccess(true);
    setResetFamilyName('');
    setResetError('');
    setPin('');
    setError('');
    resetLockout();

    // Auto-dismiss success after 3 seconds and close the reset flow
    setTimeout(() => {
      setResetSuccess(false);
      setShowForgotPin(false);
    }, 3000);
  };

  const goBack = () => {
    setMode(null);
    setPin('');
    setError('');
    setShowForgotPin(false);
    setResetFamilyName('');
    setResetError('');
    setResetSuccess(false);
    setSelectedKid(null);
  };

  // === PARENT LOGIN (with optional PIN) ===
  if (mode === 'parent') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <button onClick={goBack} className="flex items-center gap-1 text-kidzy-gray hover:text-kidzy-purple text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="text-center mb-5">
            <h1 className="text-2xl font-display font-bold text-kidzy-dark">Welcome back!</h1>
            <p className="text-kidzy-gray text-sm mt-1">Select your profile{hasPIN ? ' and enter your PIN' : ''}</p>
          </div>

          {/* Parent selector */}
          <div className="flex gap-3 flex-wrap justify-center mb-5">
            {state.parents.map(parent => (
              <button
                key={parent.id}
                onClick={() => setSelectedParent(parent.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                  selectedParent === parent.id ? 'bg-kidzy-purple/10 ring-2 ring-kidzy-purple scale-105' : 'hover:bg-gray-50'
                }`}
              >
                <Avatar src={parent.avatar} name={parent.name} size="lg" />
                <span className={`text-sm font-semibold ${selectedParent === parent.id ? 'text-kidzy-purple' : 'text-kidzy-dark'}`}>{parent.name}</span>
              </button>
            ))}
          </div>

          {/* Forgot PIN — Multi-step verification */}
          {showForgotPin && (
            <div className="mb-4 animate-slide-up">
              {resetSuccess ? (
                // Success message
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{'\u{2713}'}</div>
                    <h3 className="font-bold text-green-800 text-sm">PIN Removed Successfully</h3>
                    <p className="text-green-700 text-xs mt-2">
                      You can now log in without a PIN. You can set a new PIN in Settings anytime.
                    </p>
                  </div>
                </div>
              ) : (
                // Verification form
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-800 text-sm">Verify Your Identity</h3>
                      <p className="text-amber-700 text-xs mt-1">
                        Type your family name exactly to reset your PIN.
                      </p>

                      {/* Family name input */}
                      <input
                        type="text"
                        placeholder="Your family name"
                        value={resetFamilyName}
                        onChange={e => {
                          setResetFamilyName(e.target.value);
                          setResetError('');
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleForgotPinReset()}
                        autoFocus
                        className="w-full mt-2.5 px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none text-sm"
                      />

                      {/* Error message */}
                      {resetError && (
                        <p className="text-red-600 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span>{'\u{26A0}'}</span> {resetError}
                        </p>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleForgotPinReset}
                          className="flex-1 px-4 py-1.5 bg-amber-500 text-white font-bold rounded-lg text-xs hover:bg-amber-600 transition-colors"
                        >
                          Verify & Reset PIN
                        </button>
                        <button
                          onClick={() => {
                            setShowForgotPin(false);
                            setResetFamilyName('');
                            setResetError('');
                          }}
                          className="px-4 py-1.5 bg-gray-200 text-gray-600 font-medium rounded-lg text-xs hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PIN entry (only if PIN is set) */}
          {hasPIN && !showForgotPin ? (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">
                <Lock size={14} className="inline mr-1" /> Your PIN
              </label>
              <input
                type="password"
                placeholder={'\u{2022}\u{2022}\u{2022}\u{2022}'}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                disabled={lockoutSeconds > 0}
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg tracking-[0.5em] text-center transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                inputMode="numeric"
              />
              {lockoutSeconds > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-sm justify-center">
                  <ShieldAlert size={14} />
                  <span>Locked out. Try again in {lockoutSeconds}s</span>
                </div>
              )}
              {error && !lockoutSeconds && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}

              {/* Forgot PIN link */}
              <button
                onClick={() => setShowForgotPin(true)}
                className="w-full mt-2 text-xs text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium flex items-center justify-center gap-1"
              >
                <KeyRound size={12} /> Forgot PIN?
              </button>
            </div>
          ) : null}

          {!showForgotPin && (
            <button
              onClick={handleLogin}
              disabled={hasPIN ? (pin.length < 4 || lockoutSeconds > 0) : false}
              className="w-full bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            >
              <LogIn size={18} /> {hasPIN ? 'Sign In' : `Continue as ${state.parents.find(p => p.id === selectedParent)?.name || 'Parent'}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // === KID MODE SELECTOR — THE GAME-LIKE CHARACTER SELECT ===
  if (mode === 'kid') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex flex-col relative overflow-hidden">
        <FloatingStars />

        {/* Top bar */}
        <div className="relative z-10 p-4 flex items-center">
          <button onClick={goBack} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Hero section */}
        <div className="relative z-10 text-center px-6 pt-2 pb-6">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-3 animate-bounce-in">
            <Star size={14} className="animate-pulse" />
            <span>PLAYER SELECT</span>
            <Star size={14} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1 animate-slide-up">
            {greeting}
          </h1>
          <p className="text-white/50 text-sm">Tap your character to start playing</p>
        </div>

        {/* Kid character cards */}
        <div className="relative z-10 flex-1 px-4 pb-8 space-y-3 overflow-y-auto">
          {state.kids.map((kid, index) => {
            const theme = KID_CARD_THEMES[index % KID_CARD_THEMES.length];
            const balance = getKidBalance(kid.id, state.transactions);
            const streak = getStreak(kid.id, state.transactions);
            return (
              <div key={kid.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.2}s`, animationFillMode: 'both' }}>
                <KidCharacterCard
                  kid={kid}
                  theme={theme}
                  index={index}
                  balance={balance}
                  streak={streak}
                  onSelect={handleKidSelect}
                  isSelected={selectedKid === kid.id}
                />
              </div>
            );
          })}

          {state.kids.length === 0 && (
            <div className="text-center py-10 animate-slide-up">
              <div className="text-6xl mb-3 animate-wiggle">{'\u{1F476}'}</div>
              <p className="text-white/80 font-display font-bold text-lg">No players yet!</p>
              <p className="text-white/50 text-sm mt-1">Ask a parent to add you to the team</p>
            </div>
          )}
        </div>

        {/* Bottom glow decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  // === MODE SELECTOR (default) ===
  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{'\u{2B50}'}</div>
          <h1 className="text-3xl font-display font-bold text-kidzy-dark">Kidzy</h1>
          <p className="text-kidzy-gray mt-1 text-sm">{state.family.name}</p>
        </div>

        <p className="text-center text-sm font-semibold text-kidzy-dark mb-4">Who's using Kidzy?</p>

        <div className="space-y-3">
          {/* Parent option */}
          <button
            onClick={() => setMode('parent')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-kidzy-purple/40 hover:bg-purple-50/30 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-kidzy-purple to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <span className="text-2xl">{'\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}'}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-kidzy-dark text-lg">I'm a Parent</p>
              <p className="text-kidzy-gray text-sm">Award K$ points, manage rewards</p>
            </div>
            <div className="text-gray-300 group-hover:text-kidzy-purple transition-colors">
              <ArrowLeft size={18} className="rotate-180" />
            </div>
          </button>

          {/* Kid option — more playful */}
          <button
            onClick={() => setMode('kid')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-kidzy-green/40 hover:bg-green-50/30 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-kidzy-green to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <span className="text-2xl">{'\u{1F9D2}'}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-kidzy-dark text-lg">I'm a Kid</p>
              <p className="text-kidzy-gray text-sm">Check my K$ points and rewards</p>
            </div>
            <div className="text-gray-300 group-hover:text-kidzy-green transition-colors">
              <ArrowLeft size={18} className="rotate-180" />
            </div>
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium py-2"
        >
          <Home size={14} /> Back to Home
        </button>
      </div>
    </div>
  );
}
