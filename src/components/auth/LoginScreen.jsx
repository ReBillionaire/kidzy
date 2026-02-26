import { useState, useEffect } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { verifyPin, hashPin, isLockedOut, recordFailedAttempt, resetLockout } from '../../utils/storage';
import Avatar from '../shared/Avatar';
import { Lock, LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isKidMode, setIsKidMode] = useState(false);

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

  const handleKidMode = () => {
    setIsKidMode(true);
  };

  // Kid mode - read-only view
  if (isKidMode) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{'\u{1F31F}'}</div>
            <h1 className="text-2xl font-display font-bold text-kidzy-dark">Hey there!</h1>
            <p className="text-kidzy-gray mt-1">Pick your name to see your dashboard</p>
          </div>

          <div className="space-y-2">
            {state.kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => dispatch({ type: 'SET_KID_MODE', payload: kid.id })}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 transition-all text-left"
              >
                <Avatar src={kid.avatar} name={kid.name} size="md" />
                <span className="font-bold text-kidzy-dark">{kid.name}</span>
                {kid.age && <span className="text-kidzy-gray text-sm ml-auto">Age {kid.age}</span>}
              </button>
            ))}
          </div>

          {state.kids.length === 0 && (
            <p className="text-center text-kidzy-gray text-sm py-4">No kids added yet. Ask a parent to add you!</p>
          )}

          <button
            onClick={() => setIsKidMode(false)}
            className="w-full mt-4 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium"
          >
            {'\u{2190}'} Back to Parent Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{'\u{2B50}'}</div>
          <h1 className="text-3xl font-display font-bold text-kidzy-dark">Kidzy</h1>
          <p className="text-kidzy-gray mt-1">{state.family.name}</p>
        </div>

        {state.parents.length > 1 && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-kidzy-dark mb-2">Who's logging in?</label>
            <div className="flex gap-3 flex-wrap justify-center">
              {state.parents.map(parent => (
                <button
                  key={parent.id}
                  onClick={() => setSelectedParent(parent.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    selectedParent === parent.id ? 'bg-kidzy-purple/10 ring-2 ring-kidzy-purple scale-105' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar src={parent.avatar} name={parent.name} size="md" />
                  <span className="text-xs font-medium">{parent.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">
            <Lock size={14} className="inline mr-1" /> Family PIN
          </label>
          <input
            type="password"
            placeholder={'\u{2022}\u{2022}\u{2022}\u{2022}'}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            disabled={lockoutSeconds > 0}
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
        </div>

        <button
          onClick={handleLogin}
          disabled={pin.length < 4 || lockoutSeconds > 0}
          className="w-full bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          <LogIn size={18} /> Sign In
        </button>

        {/* Kid Mode Button */}
        {state.kids.length > 0 && (
          <button
            onClick={handleKidMode}
            className="w-full mt-3 py-2.5 text-sm font-semibold text-kidzy-purple hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {'\u{1F9D2}'} I'm a Kid
          </button>
        )}
      </div>
    </div>
  );
}
