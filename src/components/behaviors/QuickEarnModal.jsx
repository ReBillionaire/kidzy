import { useState, useCallback, useRef, useEffect } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getCompletedBehaviorsToday, getRandomEncouragement, rollMultiplier } from '../../utils/helpers';
import Modal from '../shared/Modal';
import ConfettiEffect from '../shared/ConfettiEffect';
import DollarBadge from '../shared/DollarBadge';
import { Check, Plus, Sparkles, Zap, Undo2, Info } from 'lucide-react';
import { playCoinSound, playBonusSound, vibrateEarn, vibrateBonus } from '../../utils/sounds';

export default function QuickEarnModal({ kidId, isOpen, onClose }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastEarned, setLastEarned] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showMultiplierInfo, setShowMultiplierInfo] = useState(false);
  const [undoTx, setUndoTx] = useState(null);
  const undoTimerRef = useRef(null);

  const kid = state.kids.find(k => k.id === kidId);
  const completedToday = getCompletedBehaviorsToday(kidId, state.transactions);
  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); };
  }, []);

  const startUndoTimer = useCallback((txId, amount, reason) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTx({ id: txId, amount, reason });
    undoTimerRef.current = setTimeout(() => {
      setUndoTx(null);
      undoTimerRef.current = null;
    }, 5000);
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoTx) return;
    dispatch({ type: 'REMOVE_TRANSACTION', payload: undoTx.id });
    setUndoTx(null);
    setLastEarned(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoTx, dispatch]);

  const handleEarn = (item, categoryName) => {
    const roll = rollMultiplier();
    const finalAmount = item.dollarValue * roll.multiplier;

    // Generate tx ID ahead of time so we can undo
    const txPayload = {
      kidId,
      parentId: state.currentParentId,
      type: 'earn',
      amount: finalAmount,
      reason: item.name,
      category: categoryName,
      behaviorId: item.id,
      multiplier: roll.multiplier,
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: txPayload });

    // Find the newly created transaction (last one)
    const newTxId = state.transactions.length > 0
      ? null // We'll use a workaround since dispatch is async
      : null;

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

    // Set up undo (we'll grab the tx from state after next render)
    // Use a slight delay to let reducer update
    setTimeout(() => {
      const latestTx = document.querySelector('[data-latest-tx-id]');
      // Fallback: just store the info for undo
      startUndoTimer('__latest__', finalAmount, item.name);
    }, 50);
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
    startUndoTimer('__latest__', amount, customReason.trim());
  };

  // Better undo: grab the actual last transaction
  const handleUndoLatest = useCallback(() => {
    const lastTx = state.transactions.filter(t => t.kidId === kidId && t.type === 'earn').slice(-1)[0];
    if (lastTx) {
      dispatch({ type: 'REMOVE_TRANSACTION', payload: lastTx.id });
      setUndoTx(null);
      setLastEarned(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  }, [state.transactions, kidId, dispatch]);

  return (
    <>
      <ConfettiEffect active={showConfetti} />
      <Modal isOpen={isOpen} onClose={onClose} title={`Award K$ — ${kid?.name}`} size="lg">
        {/* Multiplier info tooltip */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-kidzy-gray">Tap a behavior to award K$ points</p>
          <button
            onClick={() => setShowMultiplierInfo(!showMultiplierInfo)}
            className="flex items-center gap-1 text-xs text-kidzy-purple hover:text-kidzy-purple-dark transition-colors"
          >
            <Zap size={12} /> Bonus info <Info size={10} />
          </button>
        </div>

        {showMultiplierInfo && (
          <div className="mb-3 p-3 bg-purple-50 rounded-xl text-xs text-purple-700 space-y-1 animate-slide-up">
            <p className="font-semibold flex items-center gap-1"><Zap size={12} /> Random Bonus Multipliers</p>
            <p>Every time you award K$, there's a chance of a bonus:</p>
            <div className="flex gap-3 mt-1">
              <span className="bg-white px-2 py-1 rounded-lg">1x — 80%</span>
              <span className="bg-yellow-100 px-2 py-1 rounded-lg font-semibold">2x — 15%</span>
              <span className="bg-amber-200 px-2 py-1 rounded-lg font-bold">3x — 5%</span>
            </div>
            <p className="text-purple-500 mt-1">It's like a surprise — kids love it!</p>
          </div>
        )}

        {/* Last earned feedback + undo */}
        {lastEarned && (
          <div className={`mb-3 p-3 rounded-xl text-center animate-bounce-in ${lastEarned.multiplier > 1 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' : 'bg-green-50 border border-green-200'}`}>
            {lastEarned.multiplier > 1 && (
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={16} className="text-yellow-500" />
                <span className="text-yellow-700 font-bold text-xs">{lastEarned.multiplier}x MULTIPLIER</span>
                <Zap size={16} className="text-yellow-500" />
              </div>
            )}
            <p className={`font-bold text-lg ${lastEarned.multiplier > 1 ? 'text-yellow-700' : 'text-green-700'}`}>+{lastEarned.amount} K$</p>
            <p className={`text-sm ${lastEarned.multiplier > 1 ? 'text-yellow-600' : 'text-green-600'}`}>{lastEarned.message}</p>
            {undoTx && (
              <button
                onClick={handleUndoLatest}
                className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 bg-white/80 px-3 py-1 rounded-full border border-gray-200 transition-colors"
              >
                <Undo2 size={12} /> Undo
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 max-h-[55dvh] overflow-y-auto">
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
                          : 'bg-white border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 active:scale-[0.98]'
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
              <h4 className="font-display font-bold text-kidzy-dark">Custom Award</h4>
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
              <Plus size={16} /> Custom Award
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
