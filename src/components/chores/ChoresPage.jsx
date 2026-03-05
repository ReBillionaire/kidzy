import { useState, useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance } from '../../utils/helpers';
import Modal from '../shared/Modal';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import ConfettiEffect from '../shared/ConfettiEffect';
import { playCoinSound, vibrateEarn } from '../../utils/sounds';
import {
  ArrowLeft, Plus, Check, Clock, RotateCcw, Trash2,
  CalendarDays, Sparkles, CheckCircle2, Circle, AlertCircle
} from 'lucide-react';

const CHORE_ICONS = ['🧹', '🍽️', '🛏️', '📚', '🐕', '🗑️', '👕', '🌱', '🧺', '🚿', '🦷', '🎒', '🧸', '🏃', '🎵', '🖌️'];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'weekly', label: 'Once a week' },
];

const PRESET_CHORES = [
  { name: 'Make the bed', icon: '🛏️', dollarValue: 2, repeat: 'daily' },
  { name: 'Brush teeth', icon: '🦷', dollarValue: 1, repeat: 'daily' },
  { name: 'Clean room', icon: '🧹', dollarValue: 5, repeat: 'weekly' },
  { name: 'Do homework', icon: '📚', dollarValue: 3, repeat: 'weekdays' },
  { name: 'Set the table', icon: '🍽️', dollarValue: 2, repeat: 'daily' },
  { name: 'Take out trash', icon: '🗑️', dollarValue: 3, repeat: 'daily' },
  { name: 'Feed the pet', icon: '🐕', dollarValue: 2, repeat: 'daily' },
  { name: 'Put away laundry', icon: '👕', dollarValue: 3, repeat: 'weekly' },
  { name: 'Water plants', icon: '🌱', dollarValue: 2, repeat: 'daily' },
  { name: 'Pack school bag', icon: '🎒', dollarValue: 1, repeat: 'weekdays' },
  { name: 'Practice instrument', icon: '🎵', dollarValue: 4, repeat: 'daily' },
  { name: 'Read for 20 mins', icon: '📚', dollarValue: 3, repeat: 'daily' },
];

function isDueToday(chore) {
  if (!chore.repeat || chore.repeat === 'none') return true;
  const day = new Date().getDay(); // 0=Sun, 1=Mon...6=Sat
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

export default function ChoresPage({ onBack }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [activeKid, setActiveKid] = useState(state.kids[0]?.id || null);
  const [showAddChore, setShowAddChore] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [filter, setFilter] = useState('today'); // today, all
  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  const kid = state.kids.find(k => k.id === activeKid);
  const chores = (state.chores || []).filter(c => c.kidId === activeKid);
  const completions = state.choreCompletions || [];

  const todayChores = useMemo(() => chores.filter(isDueToday), [chores]);
  const displayChores = filter === 'today' ? todayChores : chores;

  const todayStats = useMemo(() => {
    const total = todayChores.length;
    const done = todayChores.filter(c => isCompletedToday(c.id, completions)).length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [todayChores, completions]);

  const handleComplete = (chore) => {
    if (isCompletedToday(chore.id, completions)) return;

    // Mark chore complete
    dispatch({
      type: 'COMPLETE_CHORE',
      payload: { choreId: chore.id, kidId: activeKid, date: new Date().toISOString().split('T')[0] }
    });

    // Award K$
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId: activeKid,
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
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleDeleteChore = (choreId) => {
    dispatch({ type: 'REMOVE_CHORE', payload: choreId });
  };

  if (!state.kids.length) {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white p-4 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
            <h1 className="text-xl font-display font-bold">Chores</h1>
          </div>
        </div>
        <div className="px-4 mt-8 text-center">
          <div className="text-5xl mb-3">🧹</div>
          <h3 className="font-display font-bold text-lg">Add kids first!</h3>
          <p className="text-kidzy-gray text-sm">Go to the dashboard to add your first kid, then assign chores here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-display font-bold">Chores</h1>
          <button onClick={() => setShowAddChore(true)} className="ml-auto p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        {/* Kid selector */}
        {state.kids.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {state.kids.map(k => (
              <button
                key={k.id}
                onClick={() => setActiveKid(k.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeKid === k.id ? 'bg-white text-teal-600 shadow-md' : 'bg-white/20 text-white'
                }`}
              >
                <Avatar src={k.avatar} name={k.name} size="sm" />
                {k.name}
              </button>
            ))}
          </div>
        )}

        {/* Today's progress */}
        {kid && (
          <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Today's Progress</span>
              <span className="text-white font-bold text-sm">{todayStats.done}/{todayStats.total}</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${todayStats.percent}%` }}
              />
            </div>
            {todayStats.percent === 100 && todayStats.total > 0 && (
              <p className="text-center text-yellow-200 font-bold text-sm mt-2 animate-bounce-in">
                {'\u{1F389}'} All chores done today!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 mt-4 mb-4">
        <button
          onClick={() => setFilter('today')}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
            filter === 'today' ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-kidzy-gray hover:bg-teal-50'
          }`}
        >
          <CalendarDays size={14} className="inline mr-1" /> Today ({todayChores.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
            filter === 'all' ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-kidzy-gray hover:bg-teal-50'
          }`}
        >
          <RotateCcw size={14} className="inline mr-1" /> All Chores ({chores.length})
        </button>
      </div>

      {/* Chore List */}
      <div className="px-4 space-y-2">
        {displayChores.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl">
            <div className="text-5xl mb-3">🧹</div>
            <h3 className="font-display font-bold text-lg">No chores yet!</h3>
            <p className="text-kidzy-gray text-sm mb-4">Add chores for {kid?.name} to earn K$</p>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => setShowPresets(true)}
                className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md"
              >
                <Sparkles size={16} className="inline mr-1" /> Quick Add Preset Chores
              </button>
              <button
                onClick={() => setShowAddChore(true)}
                className="text-teal-600 font-semibold text-sm hover:text-teal-700"
              >
                <Plus size={14} className="inline mr-0.5" /> Or create custom
              </button>
            </div>
          </div>
        ) : (
          displayChores.map(chore => {
            const done = isCompletedToday(chore.id, completions);
            const dueToday = isDueToday(chore);

            return (
              <div
                key={chore.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  done ? 'border-green-200 bg-green-50/30' : dueToday ? 'border-gray-100' : 'border-gray-50 opacity-60'
                }`}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Check button */}
                  <button
                    onClick={() => dueToday && handleComplete(chore)}
                    disabled={done || !dueToday}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                      done
                        ? 'bg-green-100 text-green-600'
                        : dueToday
                          ? 'bg-gray-100 text-gray-400 hover:bg-teal-100 hover:text-teal-600 active:scale-90'
                          : 'bg-gray-50 text-gray-300'
                    }`}
                  >
                    {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  {/* Chore info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chore.icon}</span>
                      <h4 className={`font-bold text-sm truncate ${done ? 'text-green-700 line-through' : 'text-kidzy-dark'}`}>
                        {chore.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-kidzy-gray flex items-center gap-1">
                        {chore.repeat === 'daily' && <><RotateCcw size={10} /> Daily</>}
                        {chore.repeat === 'weekdays' && <><RotateCcw size={10} /> Weekdays</>}
                        {chore.repeat === 'weekly' && <><RotateCcw size={10} /> Weekly</>}
                        {(!chore.repeat || chore.repeat === 'none') && <><Clock size={10} /> One-time</>}
                      </span>
                    </div>
                  </div>

                  {/* K$ value + delete */}
                  <DollarBadge amount={chore.dollarValue} size="sm" showPlus />
                  <button
                    onClick={() => handleDeleteChore(chore.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Quick add button when chores exist */}
        {displayChores.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPresets(true)}
              className="flex-1 p-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles size={14} /> Presets
            </button>
            <button
              onClick={() => setShowAddChore(true)}
              className="flex-1 p-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Custom
            </button>
          </div>
        )}
      </div>

      {/* Add Chore Modal */}
      <AddChoreModal
        isOpen={showAddChore}
        onClose={() => setShowAddChore(false)}
        kidId={activeKid}
      />

      {/* Preset Chores Modal */}
      <PresetChoresModal
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        kidId={activeKid}
        existingChores={chores}
      />
    </div>
  );
}

function AddChoreModal({ isOpen, onClose, kidId }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [dollarValue, setDollarValue] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [repeat, setRepeat] = useState('daily');

  const handleAdd = () => {
    if (!name.trim() || !dollarValue) return;
    dispatch({
      type: 'ADD_CHORE',
      payload: { kidId, name: name.trim(), dollarValue: parseFloat(dollarValue), icon, repeat }
    });
    setName(''); setDollarValue(''); setIcon('🧹'); setRepeat('daily');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Chore">
      <div className="space-y-4">
        {/* Icon selector */}
        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Pick an Icon</label>
          <div className="flex flex-wrap gap-2">
            {CHORE_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                  icon === ic ? 'bg-teal-100 ring-2 ring-teal-400 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Chore Name</label>
          <input
            type="text"
            placeholder="e.g., Make the bed"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">K$ Reward</label>
          <input
            type="number"
            placeholder="e.g., 3"
            value={dollarValue}
            onChange={e => setDollarValue(e.target.value)}
            min="1"
            max="50"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Repeat Schedule</label>
          <div className="grid grid-cols-2 gap-2">
            {REPEAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRepeat(opt.value)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  repeat === opt.value
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-kidzy-gray hover:border-teal-200'
                }`}
              >
                {opt.value !== 'none' && <RotateCcw size={12} className="inline mr-1" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!name.trim() || !dollarValue}
        className="w-full mt-6 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50"
      >
        <Plus size={18} className="inline mr-1" /> Add Chore
      </button>
    </Modal>
  );
}

function PresetChoresModal({ isOpen, onClose, kidId, existingChores }) {
  const dispatch = useKidzyDispatch();
  const [selected, setSelected] = useState(new Set());

  const existingNames = new Set(existingChores.map(c => c.name));

  const toggle = (index) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddSelected = () => {
    selected.forEach(index => {
      const preset = PRESET_CHORES[index];
      if (!existingNames.has(preset.name)) {
        dispatch({
          type: 'ADD_CHORE',
          payload: { kidId, name: preset.name, dollarValue: preset.dollarValue, icon: preset.icon, repeat: preset.repeat }
        });
      }
    });
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Chores">
      <p className="text-xs text-kidzy-gray mb-3">Select chores to add. Already-assigned chores are greyed out.</p>
      <div className="space-y-1.5 max-h-[55dvh] overflow-y-auto">
        {PRESET_CHORES.map((preset, i) => {
          const alreadyExists = existingNames.has(preset.name);
          const isSelected = selected.has(i);
          return (
            <button
              key={i}
              onClick={() => !alreadyExists && toggle(i)}
              disabled={alreadyExists}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                alreadyExists
                  ? 'border-gray-100 bg-gray-50 opacity-50'
                  : isSelected
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/30'
              }`}
            >
              <span className="text-xl">{preset.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-kidzy-dark truncate">{preset.name}</p>
                <p className="text-xs text-kidzy-gray">
                  {preset.repeat === 'daily' ? 'Daily' : preset.repeat === 'weekdays' ? 'Weekdays' : 'Weekly'}
                </p>
              </div>
              <DollarBadge amount={preset.dollarValue} size="sm" showPlus />
              {alreadyExists ? (
                <Check size={16} className="text-gray-400" />
              ) : isSelected ? (
                <CheckCircle2 size={20} className="text-teal-500" />
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleAddSelected}
        disabled={selected.size === 0}
        className="w-full mt-4 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50"
      >
        <Plus size={18} className="inline mr-1" /> Add {selected.size} Chore{selected.size !== 1 ? 's' : ''}
      </button>
    </Modal>
  );
}
