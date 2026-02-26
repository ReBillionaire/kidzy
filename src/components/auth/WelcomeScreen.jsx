import { useState } from 'react';
import { Star, Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import Avatar from '../shared/Avatar';
import { signInWithGoogle } from '../../utils/firebase';

export default function WelcomeScreen() {
  const dispatch = useKidzyDispatch();
  const [step, setStep] = useState(0); // 0=splash, 1=family setup, 2=parent profile
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentAvatar, setParentAvatar] = useState(null);
  const [parentEmail, setParentEmail] = useState('');
  const [googleUser, setGoogleUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const user = await signInWithGoogle();
      setGoogleUser(user);
      setParentName(user.name || '');
      setParentAvatar(user.avatar || null);
      setParentEmail(user.email || '');
      setStep(1);
    } catch (err) {
      setAuthError('Sign-in failed. Try again or use manual setup.');
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetup = () => {
    if (!familyName.trim() || !parentName.trim() || pin.length < 4) return;
    dispatch({
      type: 'SETUP_FAMILY',
      payload: {
        familyName: familyName.trim(),
        pin,
        parentName: parentName.trim(),
        avatar: parentAvatar,
        email: parentEmail,
        googleUid: googleUser?.uid || null,
      }
    });
  };

  if (step === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6 text-white">
        <div className="animate-bounce-in text-center max-w-md">
          <div className="text-7xl mb-4">⭐</div>
          <h1 className="text-5xl font-display font-bold mb-3">Kidzy</h1>
          <p className="text-xl opacity-90 mb-8 font-display">Make Good Habits Fun!</p>

          <div className="space-y-4 mb-10">
            {[
              { icon: <Star size={24} />, text: 'Earn Kidzy Dollars for great behavior' },
              { icon: <Trophy size={24} />, text: 'Unlock awesome rewards & dreams' },
              { icon: <Users size={24} />, text: 'Track the whole family together' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-3 text-left" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full bg-white text-gray-700 font-bold py-4 px-8 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mb-3 disabled:opacity-70"
          >
            {authLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            )}
            {authLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Manual Setup */}
          <button
            onClick={() => setStep(1)}
            className="w-full bg-white/15 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-2xl text-lg hover:bg-white/25 transition-all flex items-center justify-center gap-2"
          >
            Set Up Manually <ArrowRight size={20} />
          </button>

          {authError && (
            <p className="text-red-200 text-sm mt-3 bg-red-500/20 rounded-lg p-2">{authError}</p>
          )}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">Create Your Family</h2>
            <p className="text-kidzy-gray mt-1">Let's set up your Kidzy family account</p>
          </div>

          {googleUser && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
              {googleUser.avatar && <img src={googleUser.avatar} className="w-8 h-8 rounded-full" alt="" />}
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">Signed in as {googleUser.name}</p>
                <p className="text-xs text-green-600">{googleUser.email}</p>
              </div>
              <span className="text-green-500">✓</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Family Name</label>
              <input
                type="text"
                placeholder="e.g., The Johnsons"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Family PIN (4+ digits)</label>
              <input
                type="password"
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg tracking-[0.5em] text-center transition-colors"
                inputMode="numeric"
              />
              <p className="text-xs text-kidzy-gray mt-1">Quick access PIN for daily use</p>
            </div>
          </div>

          <button
            onClick={() => familyName.trim() && pin.length >= 4 && setStep(2)}
            disabled={!familyName.trim() || pin.length < 4}
            className="w-full mt-6 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👤</div>
          <h2 className="text-2xl font-display font-bold text-kidzy-dark">Your Profile</h2>
          <p className="text-kidzy-gray mt-1">Set up the first parent account</p>
        </div>

        <div className="flex justify-center mb-6">
          <Avatar src={parentAvatar} name={parentName || 'P'} size="xl" editable onImageChange={setParentAvatar} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Your Name</label>
          <input
            type="text"
            placeholder="e.g., Mom, Dad, Alex"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
          />
        </div>

        <button
          onClick={handleSetup}
          disabled={!parentName.trim()}
          className="w-full mt-6 bg-gradient-to-r from-kidzy-green to-kidzy-teal text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          <Sparkles size={18} /> Launch Kidzy!
        </button>
      </div>
    </div>
  );
}
