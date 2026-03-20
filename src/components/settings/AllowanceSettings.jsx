import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { Calendar, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import Avatar from '../shared/Avatar';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AllowanceSettings() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();

  const handleSave = (kidId, settings) => {
    dispatch({ type: 'SET_ALLOWANCE', payload: { kidId, ...settings } });
  };

  const handleAllocationChange = (kidId, field, value) => {
    const current = state.savingsAllocations?.[kidId] || { save: 40, spend: 40, give: 20 };
    const updated = { ...current, [field]: parseInt(value) || 0 };
    // Auto-balance: adjust the other two proportionally
    const total = updated.save + updated.spend + updated.give;
    if (total !== 100) {
      const diff = 100 - total;
      // Add diff to the next field
      if (field === 'save') updated.spend += diff;
      else if (field === 'spend') updated.give += diff;
      else updated.save += diff;
      // Clamp
      updated.save = Math.max(0, Math.min(100, updated.save));
      updated.spend = Math.max(0, Math.min(100, updated.spend));
      updated.give = Math.max(0, Math.min(100, updated.give));
    }
    dispatch({ type: 'SET_SAVINGS_ALLOCATION', payload: { kidId, ...updated } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={18} className="text-kidzy-purple" />
        <h3 className="font-display font-bold text-kidzy-dark">Weekly Allowance</h3>
      </div>
      <p className="text-kidzy-gray text-sm">Set up automatic weekly K$ allowance for each kid.</p>

      {state.kids.map(kid => {
        const settings = state.allowanceSettings?.[kid.id] || { amount: 0, day: 'monday', enabled: false };
        const allocation = state.savingsAllocations?.[kid.id] || { save: 40, spend: 40, give: 20 };

        return (
          <div key={kid.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={kid.avatar} name={kid.name} size="sm" />
              <span className="font-bold text-kidzy-dark flex-1">{kid.name}</span>
              <button
                onClick={() => {
                  const newEnabled = !settings.enabled;
                  dispatch({ type: 'SET_ALLOWANCE', payload: { kidId: kid.id, ...settings, enabled: newEnabled } });
                }}
                className="p-1"
              >
                {settings.enabled ? (
                  <ToggleRight size={28} className="text-kidzy-green" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-300" />
                )}
              </button>
            </div>

            {settings.enabled && (
              <div className="space-y-3 animate-slide-up">
                {/* Amount */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-kidzy-gray w-20">Amount:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.amount || ''}
                      onChange={e =>
                        dispatch({
                          type: 'SET_ALLOWANCE',
                          payload: { kidId: kid.id, ...settings, amount: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-20 px-3 py-1.5 border rounded-lg text-center font-bold text-sm"
                    />
                    <span className="text-sm font-bold text-kidzy-purple">K$ / week</span>
                  </div>
                </div>

                {/* Day */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-kidzy-gray w-20">Pay day:</label>
                  <select
                    value={settings.day}
                    onChange={e =>
                      dispatch({
                        type: 'SET_ALLOWANCE',
                        payload: { kidId: kid.id, ...settings, day: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-medium capitalize"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Savings Split */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-bold text-kidzy-dark mb-2">Money Pot Split:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center">
                      <label className="text-[10px] text-emerald-600 font-bold block mb-1">Save</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={allocation.save}
                        onChange={e => handleAllocationChange(kid.id, 'save', e.target.value)}
                        className="w-full px-2 py-1 border border-emerald-200 rounded-lg text-center text-sm font-bold text-emerald-700 bg-emerald-50"
                      />
                      <span className="text-[9px] text-gray-400">%</span>
                    </div>
                    <div className="flex-1 text-center">
                      <label className="text-[10px] text-blue-600 font-bold block mb-1">Spend</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={allocation.spend}
                        onChange={e => handleAllocationChange(kid.id, 'spend', e.target.value)}
                        className="w-full px-2 py-1 border border-blue-200 rounded-lg text-center text-sm font-bold text-blue-700 bg-blue-50"
                      />
                      <span className="text-[9px] text-gray-400">%</span>
                    </div>
                    <div className="flex-1 text-center">
                      <label className="text-[10px] text-pink-600 font-bold block mb-1">Give</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={allocation.give}
                        onChange={e => handleAllocationChange(kid.id, 'give', e.target.value)}
                        className="w-full px-2 py-1 border border-pink-200 rounded-lg text-center text-sm font-bold text-pink-700 bg-pink-50"
                      />
                      <span className="text-[9px] text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
