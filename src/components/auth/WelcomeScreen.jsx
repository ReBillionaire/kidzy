import { useState } from 'react';
import { Star, Users, Trophy, ArrowRight, Sparkles, Shield, ChevronRight, Mail } from 'lucide-react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import { hashPin } from '../../utils/storage';
import Avatar from '../shared/Avatar';

export default function WelcomeScreen() {
  const dispatch = useKidzyDispatch();
  const [step, setStep] = useState(0); // 0=splash, 1=quick setup, 2=email otp
  const [parentName, setParentName] = useState('');
  const [parentAvatar, setParentAvatar] = useState(null);
  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleGoogleAuth = () => {
    // Simulated Google Auth — in production, integrate Firebase Auth
    const googleName = prompt('Simulated Google Sign-In\n\nEnter your name (as it would appear from Google):');
    if (googleName && googleName.trim()) {
      dispatch({
        type: 'SETUP_FAMILY',
        payload: {
          familyName: `${googleName.trim()}'s Family`,
          pin: null,
          parentName: googleName.trim(),
          avatar: null,
          authMethod: 'google',
        }
      });
    }
  };

  const handleSendOtp = () => {
    if (!email.trim() || !email.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }
    // Generate a random 6-digit OTP (simulated — in production use Firebase/backend)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpError('');
    // In production, this would send an actual email via backend
    alert(`Demo Mode: Your verification code is ${code}\n\n(In production, this would be sent to ${email})`);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpError('');
      // Extract name from email for convenience
      const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      dispatch({
        type: 'SETUP_FAMILY',
        payload: {
          familyName: `${nameFromEmail}'s Family`,
          pin: null,
          parentName: nameFromEmail,
          avatar: null,
          authMethod: 'email',
          email: email.trim(),
        }
      });
    } else {
      setOtpError('Invalid code. Please try again.');
      setOtp('');
    }
  };

  const handleSetup = async () => {
    if (!parentName.trim()) return;

    // If they opted for a PIN, validate it
    if (wantPin && pin.length >= 4) {
      if (pin !== confirmPin) {
        setPinError("PINs don't match. Try again.");
        return;
      }
      const hashedPin = await hashPin(pin);
      dispatch({
        type: 'SETUP_FAMILY',
        payload: {
          familyName: `${parentName.trim()}'s Family`,
          pin: hashedPin,
          parentName: parentName.trim(),
          avatar: parentAvatar,
        }
      });
    } else {
      // No PIN — just set up immediately
      dispatch({
        type: 'SETUP_FAMILY',
        payload: {
          familyName: `${parentName.trim()}'s Family`,
          pin: null,
          parentName: parentName.trim(),
          avatar: parentAvatar,
        }
      });
    }
  };

  // Step 0: Welcome splash
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6 text-white">
        <div className="animate-bounce-in text-center max-w-md">
          <div className="text-7xl mb-4">{'\u{2B50}'}</div>
          <h1 className="text-5xl font-display font-bold mb-3">Kidzy</h1>
          <p className="text-xl opacity-90 mb-8 font-display">Make Good Habits Fun!</p>

          <div className="space-y-4 mb-10">
            {[
              { icon: <Star size={24} />, text: 'Award K$ points for great behavior' },
              { icon: <Trophy size={24} />, text: 'Kids save up for real rewards' },
              { icon: <Users size={24} />, text: 'The whole family joins in' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-3 text-left" style={{ animationDelay: `${i * 0.15}s` }}>
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

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-xs font-medium">or sign up with</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGoogleAuth}
              className="flex-1 bg-white/15 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/25 transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white/15 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/25 transition-all text-sm"
            >
              <Mail size={18} />
              Email OTP
            </button>
          </div>

          <p className="text-white/60 text-xs mt-4">Takes less than 30 seconds</p>
        </div>
      </div>
    );
  }

  // Step 2: Email OTP verification
  if (step === 2) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <button onClick={() => { setStep(0); setOtpSent(false); setOtp(''); setOtpError(''); }}
            className="flex items-center gap-1 text-kidzy-gray hover:text-kidzy-purple text-sm mb-4 transition-colors">
            <ArrowRight size={16} className="rotate-180" /> Back
          </button>

          <div className="text-center mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-kidzy-purple to-kidzy-blue rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">
              {otpSent ? 'Enter Verification Code' : 'Sign Up with Email'}
            </h2>
            <p className="text-kidzy-gray mt-1 text-sm">
              {otpSent ? `We sent a 6-digit code to ${email}` : "We'll send you a one-time verification code"}
            </p>
          </div>

          {!otpSent ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-kidzy-dark mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setOtpError(''); }}
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
                />
                {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
              </div>
              <button
                onClick={handleSendOtp}
                disabled={!email.trim()}
                className="w-full bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              >
                <Mail size={18} /> Send Verification Code
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-kidzy-dark mb-1">6-Digit Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-2xl tracking-[0.5em] text-center transition-colors"
                  inputMode="numeric"
                />
                {otpError && <p className="text-red-500 text-xs mt-1 text-center">{otpError}</p>}
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6}
                className="w-full bg-gradient-to-r from-kidzy-green to-kidzy-teal text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              >
                <Sparkles size={18} /> Verify & Create Account
              </button>
              <button
                onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); }}
                className="w-full mt-2 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium py-2"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Quick setup — just your name, optional PIN
  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-display font-bold text-kidzy-dark">Welcome! Who are you?</h2>
          <p className="text-kidzy-gray mt-1 text-sm">You'll be the first parent on this account</p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-5">
          <Avatar src={parentAvatar} name={parentName || 'P'} size="xl" editable onImageChange={setParentAvatar} />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Your name</label>
          <input
            type="text"
            placeholder="e.g., Mom, Dad, Alex"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            maxLength={50}
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
          />
        </div>

        {/* Optional PIN toggle */}
        {!wantPin ? (
          <button
            onClick={() => setWantPin(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-kidzy-purple/30 hover:bg-purple-50/30 transition-all text-left mb-4"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-kidzy-dark">Add a PIN?</p>
              <p className="text-xs text-kidzy-gray">Optional — keeps kids from changing settings</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-kidzy-purple" />
                <span className="text-sm font-semibold text-kidzy-dark">Set a PIN</span>
              </div>
              <button onClick={() => { setWantPin(false); setPin(''); setConfirmPin(''); setPinError(''); }} className="text-xs text-kidzy-gray hover:text-kidzy-purple">Skip</button>
            </div>
            <input
              type="password"
              placeholder="4-digit PIN"
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-kidzy-purple focus:outline-none text-center tracking-[0.5em] transition-colors"
              inputMode="numeric"
            />
            {pin.length >= 4 && (
              <input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-kidzy-purple focus:outline-none text-center tracking-[0.5em] transition-colors"
                inputMode="numeric"
              />
            )}
            {pinError && <p className="text-red-500 text-xs text-center">{pinError}</p>}
            <p className="text-xs text-kidzy-gray">Keeps parent features protected. You can change this in Settings later.</p>
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={!parentName.trim() || (wantPin && pin.length < 4)}
          className="w-full bg-gradient-to-r from-kidzy-green to-kidzy-teal text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
        >
          <Sparkles size={18} /> Launch Kidzy!
        </button>

        <p className="text-center text-xs text-kidzy-gray mt-3">You can add more parents and kids once inside</p>
      </div>
    </div>
  );
}
