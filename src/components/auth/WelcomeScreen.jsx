import { useState } from 'react';
import { Star, Users, Trophy, ArrowRight, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import { hashPin } from '../../utils/storage';
import Avatar from '../shared/Avatar';

export default function WelcomeScreen() {
  const dispatch = useKidzyDispatch();
  const [step, setStep] = useState(0); // 0=splash, 1=quick setup
  const [parentName, setParentName] = useState('');
  const [parentAvatar, setParentAvatar] = useState(null);
  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

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
          <p className="text-white/60 text-xs mt-3">Takes less than 30 seconds</p>
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
