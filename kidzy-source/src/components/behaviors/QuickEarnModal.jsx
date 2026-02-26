import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getCompletedBehaviorsToday, getRandomEncouragement, rollMultiplier } from '../../utils/helpers';
import Modal from '../shared/Modal';
import ConfettiEffect from '../shared/ConfettiEffect';
import DollarBadge from '../shared/DollarBadge';
import { Check, Plus, Sparkles, Zap } from 'lucide-react';
import { playCoinSound, playBonusSound, vibrateEarn, vibrateBonus } from '../../utils/sounds';

export default function QuickEarnModal({ kidId, isOpen, onClose }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastEarned, setLastEarned] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const kid = state.kids.find(k => k.id === kidId);
  const completedToday = getCompletedBehaviorsToday(kidId, state.transactions);
  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  const handleEarn = (item, categoryName) => {
    const roll = rollMultiplier();
    const finalAmount = item.dollarValue * roll.multiplier;

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId,
        parentId: state.currentParentId,
        type: 'earn',
        amount: finalAmount,
        reason: item.name,
        category: categoryName,
        behaviorId: item.id,
        multiplier: roll.multiplier,
      }
    });

    if (roll.multiplier > 1) {
      if (soundEnabled) playBonusSound();
      if (hapticEnabled) vibrateBonus();
      setLastEarned({ amount: finalAmount, multiplier: roll.multiplier, message: roll.multiplier === 3 ? '\u{1F525} TRIPLE BONUS! \u{1F525}' : '\u{2728} DOUBLE BONUS! \u{2728}' });
    } else {
      if (soundEnabled) playCoinSound();
      if (hapticEnabled) vibrateEarn();
      setLastEarned({ amount: finalAmount, multiplier: 1, message: getRandomEncouragement() });
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleCustomEarn = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0 || !customReason.trim()) return;
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId,
        parentId: state.currentParentId,
        type: 'earn',
        amount,
        reason: customReason.trim(),
        category: 'Custom',
      }
    });
    if (soundEnabled) playCoinSound();
    if (hapticEnabled) vibrateEarn();
    setLastEarned({ amount, multiplier: 1, message: getRandomEncouragement() });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    setCustomAmount('');
    setCustomReason('');
    setShowCustom(false);
  };

  return (
    <>
      <ConfettiEffect active={showConfetti} />
      <Modal isOpen={isOpen} onClose={onClose} title={`Earn K$ \u2014 ${kid?.name}`} size="lg">
        {lastEarned && (
          <div className={`mb-4 p-3 rounded-xl text-center animate-bounce-in ${lastEarned.multiplier > 1 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' : 'bg-green-50 border border-green-200'}`}>
            {lastEarned.multiplier > 1 && (
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={16} className="text-yellow-500" />
                <span className="text-yellow-700 font-bold text-xs">{lastEarned.multiplier}x MULTIPLIER</span>
                <Zap size={16} className="text-yellow-500" />
              </div>
            )}
            <p className={`font-bold text-lg ${lastEarned.multiplier > 1 ? 'text-yellow-700' : 'text-green-700'}`}>+${lastEarned.amount} K$</p>
            <p className={`text-sm ${lastEarned.multiplier > 1 ? 'text-yellow-600' : 'text-green-600'}`}>{lastEarned.message}</p>
          </div>
        )}

        <div className="space-y-4 max-h-[60dvh] overflow-y-auto">
          {state.behaviorCategories.map(cat => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{cat.icon}</span>
                <h4 className="font-display font-bold text-kidzy-dark">{cat.name}</h4>
              </div>
              <div className="space-y-1.5">
                {cat.items.map(item => {
                  const isDone = completedToday.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleEarn(item, cat.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        isDone
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isDone && <Check size={16} className="text-green-500 flex-shrink-0" />}
                        <span className={`text-sm ${isDone ? 'text-green-700' : 'text-kidzy-dark'}`}>{item.name}</span>
                      </div>
                      <DollarBadge amount={item.dollarValue} size="sm" showPlus />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {showCustom ? (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <h4 className="font-display font-bold text-kidzy-dark">Custom Reward</h4>
              <input type="text" placeholder="What did they do great?" value={customReason} onChange={e => setCustomReason(e.target.value)} maxLength={100}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-kidzy-purple focus:outline-none text-sm" />
              <input type="number" placeholder="K$ amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} min="1" max="100"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-kidzy-purple focus:outline-none text-sm" />
              <div className="flex gap-2">
                <button onClick={handleCustomEarn} disabled={!customAmount || !customReason.trim()}
                  className="flex-1 bg-gradient-to-r from-kidzy-green to-kidzy-teal text-white font-bold py-2 rounded-lg disabled:opacity-50 text-sm">
                  <Sparkles size={14} className="inline mr-1" /> Award
                </button>
                <button onClick={() => setShowCustom(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCustom(true)}
              className="w-full p-3 border-2 border-dashed border-kidzy-purple/30 rounded-xl text-kidzy-purple font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} /> Custom Reward
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
