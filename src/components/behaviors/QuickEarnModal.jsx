import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getCompletedBehaviorsToday, getRandomEncouragement, rollMultiplier } from '../../utils/helpers';
import Modal from '../shared/Modal';
import ConfettiEffect from '../shared/ConfettiEffect';
import DollarBadge from '../shared/DollarBadge';
import { Check, Plus, Sparkles, Zap, Undo2, Info, CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import { playCoinSound, playBonusSound, vibrateEarn, vibrateBonus } from '../../utils/sounds';

function isDueToday(chore) {
  if (!chore.repeat || chore.repeat === 'none') return true;
  const day = new Date().getDay();
  if (chore.repeat === 'daily') return true;
  if (chore.repeat === 'weekdays') return day >= 1 && day <= 5;
  if (chore.repeat === 'weekly') {
    const created = new Date(chore.createdAt);
    const today = new Date();
    const diffDays = Math.floor((today - created) / 86400000);
    return diffDays % 7 === 0 || diffDays === 0;
  }
  return true;
}

function isCompletedToday(choreId, completions) {
  const today = new Date().toISOString().split('T')[0];
  return completions.some(c => c.choreId === choreId && c.date === today);
}

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

  // Chores data
  const completions = state.choreCompletions || [];
  const todayChores = useMemo(() => {
    return (state.chores || []).filter(c => c.kidId === kidId).filter(isDueToday);
  }, [state.chores, kidId]);

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
    // Find the actual last earn transaction for this kid
    const lastTx = state.transactions
      .filter(t => t.kidId === kidId && t.type === 'earn')
      .slice(-1)[0];
    if (lastTx) {
      dispatch({ type: 'REMOVE_TRANSACTION', payload: lastTx.id });
    }
    setUndoTx(null);
    setLastEarned(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoTx, state.transactions, kidId, dispatch]);

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

    // Set up undo timer
    startUndoTimer('pending', finalAmount, item.name);
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
    startUndoTimer('pending', amount, customReason.trim());
  };

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
                onClick={handleUndo}
                className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 bg-white/80 px-3 py-1 rounded-full border border-gray-200 transition-colors"
              >
                <Undo2 size={12} /> Undo
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 max-h-[55dvh] overflow-y-auto">
          {/* Today's Chores section */}
          {todayChores.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={18} className="text-teal-500" />
                <h4 className="font-display font-bold text-kidzy-dark">Today's Chores</h4>
                <span className="text-xs text-kidzy-gray ml-auto">
                  {todayChores.filter(c => isCompletedToday(c.id, completions)).length}/{todayChores.length} done
                </span>
              </div>
              <div className="space-y-1.5">
                {todayChores.map(chore => {
                  const done = isCompletedToday(chore.id, completions);
                  return (
                    <button
                      key={chore.id}
                      onClick={() => {
                        if (done) return;
                        dispatch({
                          type: 'COMPLETE_CHORE',
                          payload: { choreId: chore.id, kidId, date: new Date().toISOString().split('T')[0] }
                        });
                        dispatch({
                          type: 'ADD_TRANSACTION',
                          payload: {
                            kidId,
                            parentId: state.currentParentId || 'system',
                            type: 'earn',
                            amount: chore.dollarValue,
                            reason: `Chore: ${chore.name}`,
                            category: 'Chore',
                            choreId: chore.id,
                          }
                        });
                        if (soundEnabled) playCoinSound();
                        if (hapticEnabled) vibrateEarn();
                        setLastEarned({ amount: chore.dollarValue, multiplier: 1, message: getRandomEncouragement() });
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 2000);
                      }}
                      disabled={done}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        done
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {done ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> : <Circle size={16} className="text-gray-300 flex-shrink-0" />}
                        <span className="text-lg flex-shrink-0">{chore.icon}</span>
                        <span className={`text-sm ${done ? 'text-green-700 line-through' : 'text-kidzy-dark'}`}>{chore.name}</span>
                      </div>
                      <DollarBadge amount={chore.dollarValue} size="sm" showPlus />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Behavior categories */}
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
