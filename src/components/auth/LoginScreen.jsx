import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import Avatar from '../shared/Avatar';
import { Lock, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../utils/firebase';

export default function LoginScreen() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = () => {
    if (pin === state.family.pin) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: selectedParent || state.parents[0]?.id });
      setError('');
    } else {
      setError('Wrong PIN. Try again!');
      setPin('');
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      // Find matching parent by email or Google UID
      const matchedParent = state.parents.find(
        p => p.email === user.email || p.googleUid === user.uid
      );
      if (matchedParent) {
        dispatch({ type: 'SET_CURRENT_PARENT', payload: matchedParent.id });
      } else {
        // Fallback to PIN — Google account not linked to any parent
        setError('This Google account isn\'t linked to a parent. Use PIN or add this parent in Settings.');
      }
    } catch (err) {
      setError('Google sign-in failed. Use your PIN instead.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⭐</div>
          <h1 className="text-3xl font-display font-bold text-kidzy-dark">Kidzy</h1>
          <p className="text-kidzy-gray mt-1">{state.family.name}</p>
        </div>

        {/* Google Quick Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-4 disabled:opacity-70"
        >
          {authLoading ? (
            <span className="animate-spin text-sm">⏳</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          )}
          {authLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-kidzy-gray font-medium">or use PIN</span>
          <div className="flex-1 h-px bg-gray-200"></div>
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
            placeholder="••••"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg tracking-[0.5em] text-center transition-colors"
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}
        </div>

        <button
          onClick={handleLogin}
          disabled={pin.length < 4}
          className="w-full bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          <LogIn size={18} /> Sign In
        </button>
      </div>
    </div>
  );
}
