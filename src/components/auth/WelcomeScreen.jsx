import { useState } from 'react';
import { Star, Users, Trophy, ArrowRight, Sparkles, Mail, KeyRound, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createFamily, joinFamily } from '../../utils/firestore';
import Avatar from '../shared/Avatar';

export default function WelcomeScreen() {
  const { user, emailSignUp, emailSignIn, googleSignIn, passwordReset, authError, clearError, refreshFamilies } = useAuth();

  // Steps: 0=splash, 1=auth (sign up/in), 2=create-or-join, 3=create family, 4=join family
  const [step, setStep] = useState(user ? 2 : 0);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [parentName, setParentName] = useState(user?.name || '');
  const [parentAvatar, setParentAvatar] = useState(user?.avatar || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // If user signed in (from Google or email), jump to create-or-join
  if (user && step < 2) {
    setStep(2);
    setParentName(user.name || '');
    setParentAvatar(user.avatar || null);
  }

  // ── Handle Email Auth ─────────────────────────────────────────────
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    clearError();
    try {
      if (authMode === 'signup') {
        if (!displayName.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        await emailSignUp(email.trim(), password, displayName.trim());
        setParentName(displayName.trim());
      } else {
        await emailSignIn(email.trim(), password);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Handle Google Auth ────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    clearError();
    try {
      const u = await googleSignIn();
      setParentName(u.name || '');
      setParentAvatar(u.avatar || null);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Create Family ─────────────────────────────────────────────────
  const handleCreateFamily = async () => {
    if (!familyName.trim() || !parentName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createFamily(user.uid, familyName.trim(), parentName.trim(), parentAvatar, user.email);
      await refreshFamilies();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Join Family ───────────────────────────────────────────────────
  const handleJoinFamily = async () => {
    if (!inviteCode.trim() || !parentName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinFamily(user.uid, inviteCode.trim(), parentName.trim(), parentAvatar, user.email);
      await refreshFamilies();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Handle Password Reset ─────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!email.trim()) { setError('Enter your email first.'); return; }
    try {
      await passwordReset(email.trim());
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const errorMsg = error || authError;

  // ── Step 0: Splash ────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6 text-white">
        <div className="animate-bounce-in text-center max-w-md">
          <div className="text-7xl mb-4">&#11088;</div>
          <h1 className="text-5xl font-display font-bold mb-3">Kidzy</h1>
          <p className="text-xl opacity-90 mb-8 font-display">Make Good Habits Fun!</p>

          <div className="space-y-4 mb-10">
            {[
              { icon: <Star size={24} />, text: 'Earn Kidzy Dollars for great behavior' },
              { icon: <Trophy size={24} />, text: 'Unlock awesome rewards & dreams' },
              { icon: <Users size={24} />, text: 'Track the whole family together' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-3 text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full bg-white text-kidzy-purple font-bold py-4 px-8 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Sign Up / Sign In ─────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{authMode === 'signup' ? '\u{1F44B}' : '\u{1F513}'}</div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">
              {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-kidzy-gray mt-1">
              {authMode === 'signup' ? 'Sign up to get started' : 'Sign in to your account'}
            </p>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all disabled:opacity-50 mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase">or use email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-kidzy-dark mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mom, Dad, Alex"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Email</label>
              <input
                type="email"
                placeholder="parent@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Password</label>
              <input
                type="password"
                placeholder={authMode === 'signup' ? '6+ characters' : 'Your password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none transition-colors"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm mt-3 text-center">{errorMsg}</p>}
          {resetSent && <p className="text-green-600 text-sm mt-3 text-center">Password reset email sent! Check your inbox.</p>}

          <button
            onClick={handleEmailAuth}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full mt-4 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : authMode === 'signup' ? (
              <><UserPlus size={18} /> Create Account</>
            ) : (
              <><LogIn size={18} /> Sign In</>
            )}
          </button>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setError(''); clearError(); }}
              className="text-sm text-kidzy-purple font-medium hover:underline"
            >
              {authMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            {authMode === 'signin' && (
              <button onClick={handlePasswordReset} className="block w-full text-sm text-kidzy-gray hover:text-kidzy-purple font-medium">
                Forgot password?
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Create or Join Family ─────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">&#128106;</div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">Hi, {user?.name || 'there'}!</h2>
            <p className="text-kidzy-gray mt-1">What would you like to do?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { setStep(3); setParentName(user?.name || ''); }}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 border-2 border-kidzy-purple/20 rounded-2xl hover:border-kidzy-purple/40 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 bg-kidzy-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} className="text-kidzy-purple" />
              </div>
              <div>
                <p className="font-bold text-kidzy-dark">Create a Family</p>
                <p className="text-sm text-kidzy-gray">Start fresh with a new family</p>
              </div>
            </button>

            <button
              onClick={() => { setStep(4); setParentName(user?.name || ''); }}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-kidzy-green/5 to-kidzy-teal/5 border-2 border-kidzy-teal/20 rounded-2xl hover:border-kidzy-teal/40 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 bg-kidzy-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus size={24} className="text-kidzy-teal" />
              </div>
              <div>
                <p className="font-bold text-kidzy-dark">Join a Family</p>
                <p className="text-sm text-kidzy-gray">Use an invite code from a family member</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Create Family ─────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">&#127793;</div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">Create Your Family</h2>
          </div>

          <div className="flex justify-center mb-4">
            <Avatar src={parentAvatar} name={parentName || 'P'} size="xl" editable onImageChange={setParentAvatar} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Family Name</label>
              <input
                type="text"
                placeholder="e.g., The Johnsons"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-kidzy-dark mb-1">Your Display Name</label>
              <input
                type="text"
                placeholder="e.g., Mom, Dad, Alex"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm mt-3 text-center">{errorMsg}</p>}

          <button
            onClick={handleCreateFamily}
            disabled={loading || !familyName.trim() || !parentName.trim()}
            className="w-full mt-6 bg-gradient-to-r from-kidzy-green to-kidzy-teal text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Sparkles size={18} /> Create Family</>
            )}
          </button>

          <button onClick={() => setStep(2)} className="w-full mt-3 text-sm text-kidzy-gray hover:text-kidzy-purple font-medium transition-colors">
            &#8592; Back
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Join Family ───────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">&#128279;</div>
          <h2 className="text-2xl font-display font-bold text-kidzy-dark">Join a Family</h2>
          <p className="text-kidzy-gray mt-1">Ask a family member for their invite code</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-kidzy-dark mb-1">Invite Code</label>
            <input
              type="text"
              placeholder="e.g., ABC123"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-teal focus:outline-none text-2xl tracking-[0.5em] text-center font-bold transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-kidzy-dark mb-1">Your Display Name</label>
            <input
              type="text"
              placeholder="e.g., Mom, Dad, Alex"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-teal focus:outline-none text-lg transition-colors"
            />
          </div>
        </div>

        {errorMsg && <p className="text-red-500 text-sm mt-3 text-center">{errorMsg}</p>}

        <button
          onClick={handleJoinFamily}
          disabled={loading || inviteCode.length < 6 || !parentName.trim()}
          className="w-full mt-6 bg-gradient-to-r from-kidzy-teal to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><UserPlus size={18} /> Join Family</>
          )}
        </button>

        <button onClick={() => setStep(2)} className="w-full mt-3 text-sm text-kidzy-gray hover:text-kidzy-purple font-medium transition-colors">
          &#8592; Back
        </button>
      </div>
    </div>
  );
}
