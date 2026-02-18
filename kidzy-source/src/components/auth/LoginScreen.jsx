import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import Avatar from '../shared/Avatar';
import { Lock, LogIn } from 'lucide-react';

export default function LoginScreen() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);

  const handleLogin = () => {
    if (pin === state.family.pin) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: selectedParent || state.parents[0]?.id });
      setError('');
    } else {
      setError('Wrong PIN. Try again!');
      setPin('');
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
