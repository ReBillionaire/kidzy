import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import Modal from '../shared/Modal';
import { AlertTriangle, Minus, Check, X } from 'lucide-react';
import { playDeductSound, vibrateDeduct } from '../../utils/sounds';

const DEDUCTION_REASONS = [
  { reason: 'Didn\'t listen to parents', amount: 2, icon: '\u{1F649}' },
  { reason: 'Screen time tantrum', amount: 3, icon: '\u{1F4F1}' },
  { reason: 'Fighting with siblings', amount: 3, icon: '\u{1F624}' },
  { reason: 'Skipped homework', amount: 3, icon: '\u{1F4DD}' },
  { reason: 'Rude behavior', amount: 2, icon: '\u{1F620}' },
  { reason: 'Didn\'t clean up', amount: 2, icon: '\u{1F9F9}' },
  { reason: 'Late to bed', amount: 2, icon: '\u{1F319}' },
  { reason: 'Skipped brushing teeth', amount: 1, icon: '\u{1F9B7}' },
];

export default function DeductModal({ kidId, isOpen, onClose }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [customAmount, setCustomAmount] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [lastDeducted, setLastDeducted] = useState(null);
  const [pendingDeduction, setPendingDeduction] = useState(null);

  const kid = state.kids.find(k => k.id === kidId);
  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  const confirmDeduct = (reason, amount) => {
    setPendingDeduction({ reason, amount });
  };

  const executeDeduct = () => {
    if (!pendingDeduction) return;
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId,
        parentId: state.currentParentId,
        type: 'deduct',
        amount: pendingDeduction.amount,
        reason: pendingDeduction.reason,
      }
    });
    if (soundEnabled) playDeductSound();
    if (hapticEnabled) vibrateDeduct();
    setLastDeducted(pendingDeduction);
    setPendingDeduction(null);
  };

  const handleCustomDeduct = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0 || !customReason.trim()) return;
    confirmDeduct(customReason.trim(), amount);
    setCustomAmount('');
    setCustomReason('');
    setShowCustom(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Deduct K$ \u2014 ${kid?.name}`}>
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
        <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">Deductions help teach responsibility. Use them fairly and consistently.</p>
      </div>

      {/* Confirmation Dialog */}
      {pendingDeduction && (
        <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl animate-bounce-in">
          <p className="text-amber-800 font-bold text-center mb-1">Confirm Deduction?</p>
          <p className="text-amber-700 text-center text-sm mb-3">
            Deduct <span className="font-bold">${pendingDeduction.amount} K$</span> from {kid?.name} for &quot;{pendingDeduction.reason}&quot;?
          </p>
          <div className="flex gap-2">
            <button
              onClick={executeDeduct}
              className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-sm"
            >
              <Check size={16} /> Yes, Deduct
            </button>
            <button
              onClick={() => setPendingDeduction(null)}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 text-sm"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {lastDeducted && !pendingDeduction && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center animate-bounce-in">
          <p className="text-red-700 font-bold">&minus;${lastDeducted.amount} K$</p>
          <p className="text-red-600 text-sm">{lastDeducted.reason}</p>
        </div>
      )}

      <div className="space-y-2 max-h-[50dvh] overflow-y-auto">
        {DEDUCTION_REASONS.map((item, i) => (
          <button
            key={i}
            onClick={() => confirmDeduct(item.reason, item.amount)}
            className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-kidzy-dark">{item.reason}</span>
            </div>
            <span className="text-sm font-bold text-red-500">&minus;${item.amount}</span>
          </button>
        ))}

        {showCustom ? (
          <div className="bg-red-50 rounded-xl p-4 space-y-3">
            <h4 className="font-display font-bold text-kidzy-dark">Custom Deduction</h4>
            <input
              type="text"
              placeholder="Reason for deduction"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
            />
            <input
              type="number"
              placeholder="K$ amount"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              min="1"
              max="100"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCustomDeduct}
                disabled={!customAmount || !customReason.trim()}
                className="flex-1 bg-gradient-to-r from-red-400 to-rose-500 text-white font-bold py-2 rounded-lg disabled:opacity-50 text-sm"
              >
                <Minus size={14} className="inline mr-1" /> Deduct
              </button>
              <button onClick={() => setShowCustom(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full p-3 border-2 border-dashed border-red-300 rounded-xl text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            <Minus size={16} className="inline mr-1" /> Custom Deduction
          </button>
        )}
      </div>
    </Modal>
  );
}
