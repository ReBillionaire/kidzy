import { useState } from 'react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import { Plus, Minus, Gift, Trophy, ChevronRight, Sparkles } from 'lucide-react';

const STEPS = [
  {
    emoji: '\u{1F44B}',
    title: 'Welcome to Kidzy!',
    body: 'Kidzy helps you reward your kids for great behavior with virtual Kidzy Dollars (K$). Here\'s a quick tour!',
    color: 'from-kidzy-purple to-kidzy-blue',
  },
  {
    emoji: '\u{2795}',
    title: 'Earn K$',
    body: 'Tap the green Earn button on any kid\'s card to award K$ for completing behaviors like brushing teeth, doing homework, or being kind.',
    color: 'from-green-400 to-emerald-500',
    icon: Plus,
  },
  {
    emoji: '\u{2796}',
    title: 'Deduct K$',
    body: 'Use the red Deduct button when behaviors need correcting. Deductions teach responsibility \u2014 a confirmation will always appear before deducting.',
    color: 'from-red-400 to-rose-500',
    icon: Minus,
  },
  {
    emoji: '\u{1F381}',
    title: 'Set Up Rewards',
    body: 'Go to Rewards to add wishes your kids can work towards. When they save enough K$, they can redeem their wish!',
    color: 'from-kidzy-pink to-kidzy-orange',
    icon: Gift,
  },
  {
    emoji: '\u{1F3C6}',
    title: 'Leaderboard & Badges',
    body: 'The Leaderboard tracks weekly rankings and badges. Kids can earn 14 different achievement badges as they progress!',
    color: 'from-amber-400 to-orange-500',
    icon: Trophy,
  },
  {
    emoji: '\u{2728}',
    title: 'Bonus Multipliers!',
    body: 'Every time a kid earns K$, there\'s a chance for a 2x or 3x bonus multiplier! This random surprise keeps things exciting.',
    color: 'from-yellow-400 to-amber-500',
    icon: Sparkles,
  },
];

export default function OnboardingTutorial() {
  const dispatch = useKidzyDispatch();
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETE' });
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-4 px-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-kidzy-purple' : i < step ? 'w-4 bg-kidzy-purple/40' : 'w-4 bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-2xl font-display font-bold text-kidzy-dark mb-3">{current.title}</h2>
          <p className="text-kidzy-gray leading-relaxed">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? handleComplete : () => setStep(s => s + 1)}
            className={`flex-1 bg-gradient-to-r ${current.color} text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm hover:shadow-xl transition-all`}
          >
            {isLast ? (
              <><Sparkles size={16} /> Start Using Kidzy!</>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={handleComplete}
            className="w-full pb-4 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium"
          >
            Skip Tutorial
          </button>
        )}
      </div>
    </div>
  );
}
