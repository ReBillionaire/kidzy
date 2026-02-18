import { useState } from 'react';
import { Star, Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import Avatar from '../shared/Avatar';

export default function WelcomeScreen() {
  const dispatch = useKidzyDispatch();
  const [step, setStep] = useState(0); // 0=splash, 1=family setup, 2=parent profile
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentAvatar, setParentAvatar] = useState(null);

  const handleSetup = () => {
    if (!familyName.trim() || !parentName.trim() || pin.length < 4) return;
    dispatch({
      type: 'SETUP_FAMILY',
      payload: { familyName: familyName.trim(), pin, parentName: parentName.trim(), avatar: parentAvatar }
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

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-display font-bold text-kidzy-dark">Create Your Family</h2>
            <p className="text-kidzy-gray mt-1">Let's set up your Kidzy family account</p>
          </div>

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
              <p className="text-xs text-kidzy-gray mt-1">Used to protect parent access</p>
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
