import { useState, useEffect } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { verifyPin, hashPin, isLockedOut, recordFailedAttempt, resetLockout } from '../../utils/storage';
import Avatar from '../shared/Avatar';
import { Lock, LogIn, ShieldAlert, ArrowLeft, KeyRound, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    dispatch({ type: 'SET_KID_MODE', payload: kidId });
  };

  const handleForgotPinReset = () => {
    // Remove the PIN so parent can log in without it
    dispatch({ type: 'SET_FAMILY_PIN', payload: null });
    setShowForgotPin(false);
    setPin('');
    setError('');
    resetLockout();
    // Auto-login to the first parent
    dispatch({ type: 'SET_CURRENT_PARENT', payload: state.parents[0]?.id });
  };

  const goBack = () => {
    setMode(null);
    setPin('');
    setError('');
    setShowForgotPin(false);
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

          {/* Forgot PIN confirmation */}
          {showForgotPin && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl animate-slide-up">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-800 text-sm">Reset your PIN?</h3>
                  <p className="text-amber-700 text-xs mt-1">
                    This will remove PIN protection. You can set a new PIN in Settings after logging in.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleForgotPinReset}
                      className="px-4 py-1.5 bg-amber-500 text-white font-bold rounded-lg text-xs"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => setShowForgotPin(false)}
                      className="px-4 py-1.5 bg-gray-200 text-gray-600 font-medium rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
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

  // === KID MODE SELECTOR ===
  if (mode === 'kid') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <button onClick={goBack} className="flex items-center gap-1 text-kidzy-gray hover:text-kidzy-purple text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="text-center mb-5">
            <div className="text-5xl mb-2">{'\u{1F31F}'}</div>
            <h1 className="text-2xl font-display font-bold text-kidzy-dark">Hey there!</h1>
            <p className="text-kidzy-gray text-sm mt-1">Tap your name to see your K$ points</p>
          </div>

          <div className="space-y-2">
            {state.kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => handleKidSelect(kid.id)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 transition-all text-left"
              >
                <Avatar src={kid.avatar} name={kid.name} size="md" />
                <span className="font-bold text-kidzy-dark text-lg">{kid.name}</span>
                {kid.age && <span className="text-kidzy-gray text-sm ml-auto">Age {kid.age}</span>}
              </button>
            ))}
          </div>

          {state.kids.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <p className="text-4xl mb-2">{'\u{1F476}'}</p>
              <p className="text-kidzy-gray text-sm">No kids added yet. Ask a parent to add you!</p>
            </div>
          )}
        </div>
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

          {/* Kid option */}
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
