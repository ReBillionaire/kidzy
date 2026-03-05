import { useState, useRef } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { exportData, importData } from '../../utils/storage';
import Modal from '../shared/Modal';
import Avatar from '../shared/Avatar';
import { ArrowLeft, UserPlus, Trash2, Users, Baby, Shield, Palette, Download, Upload, Volume2, VolumeX, Smartphone, Plus, Edit3, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsPage({ onBack }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showAddParent, setShowAddParent] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(null); // categoryId
  const [expandedCat, setExpandedCat] = useState(null);
  const fileRef = useRef(null);

  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importData(file);
      dispatch({ type: 'LOAD_DATA', payload: data });
      setImportStatus('success');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
    e.target.value = '';
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-teal to-cyan-500 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-display font-bold">Family Settings</h1>
        </div>
        <p className="text-teal-100 text-sm">{state.family?.name}</p>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {/* Parents Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2"><Users size={20} className="text-kidzy-teal" /> Parents</h2>
            <button onClick={() => setShowAddParent(true)} className="text-sm font-semibold text-kidzy-teal flex items-center gap-1">
              <UserPlus size={16} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {state.parents.map(parent => (
              <div key={parent.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                <Avatar src={parent.avatar} name={parent.name} size="md" editable onImageChange={(img) => dispatch({ type: 'UPDATE_PARENT', payload: { id: parent.id, avatar: img } })} />
                <div className="flex-1">
                  <p className="font-semibold">{parent.name}</p>
                  <p className="text-xs text-kidzy-gray">{parent.role === 'admin' ? 'Admin' : 'Parent'}</p>
                </div>
                {parent.id === state.currentParentId && (
                  <span className="text-xs bg-kidzy-teal/10 text-kidzy-teal px-2 py-1 rounded-full font-medium">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kids Section */}
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3"><Baby size={20} className="text-kidzy-pink" /> Kids</h2>
          <div className="space-y-2">
            {state.kids.length === 0 ? (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <p className="text-kidzy-gray text-sm">No kids added yet. Add kids from the dashboard!</p>
              </div>
            ) : state.kids.map(kid => (
              <div key={kid.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                <Avatar src={kid.avatar} name={kid.name} size="md" editable onImageChange={(img) => dispatch({ type: 'UPDATE_KID', payload: { id: kid.id, avatar: img } })} />
                <div className="flex-1">
                  <p className="font-semibold">{kid.name}</p>
                  {kid.age && <p className="text-xs text-kidzy-gray">Age {kid.age}</p>}
                </div>
                <button onClick={() => {
                  if (confirm(`Remove ${kid.name}? This will delete all their data.`)) {
                    dispatch({ type: 'REMOVE_KID', payload: kid.id });
                  }
                }} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sound & Haptic Settings */}
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3">
            <Volume2 size={20} className="text-kidzy-blue" /> Sounds & Feedback
          </h2>
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                {soundEnabled ? <Volume2 size={20} className="text-kidzy-blue" /> : <VolumeX size={20} className="text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Sound Effects</p>
                <p className="text-xs text-kidzy-gray">Coin sounds when earning K$</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { soundEnabled: !soundEnabled } })}
                className={`w-12 h-7 rounded-full transition-colors relative ${soundEnabled ? 'bg-kidzy-blue' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Smartphone size={20} className={hapticEnabled ? 'text-kidzy-purple' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Haptic Feedback</p>
                <p className="text-xs text-kidzy-gray">Vibrations on actions</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { hapticEnabled: !hapticEnabled } })}
                className={`w-12 h-7 rounded-full transition-colors relative ${hapticEnabled ? 'bg-kidzy-purple' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${hapticEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Behavior Categories - Now Editable */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2"><Palette size={20} className="text-kidzy-purple" /> Behavior Categories</h2>
            <button onClick={() => setShowAddCategory(true)} className="text-sm font-semibold text-kidzy-purple flex items-center gap-1">
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {state.behaviorCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="w-full p-3 flex items-center gap-2 text-left"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-semibold flex-1">{cat.name}</span>
                  <span className="text-xs text-kidzy-gray mr-2">{cat.items.length} items</span>
                  {expandedCat === cat.id ? <ChevronUp size={16} className="text-kidzy-gray" /> : <ChevronDown size={16} className="text-kidzy-gray" />}
                </button>

                {expandedCat === cat.id && (
                  <div className="border-t border-gray-100 p-3 space-y-2">
                    {cat.items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <span className="text-sm flex-1">{item.name}</span>
                        <span className="text-xs font-bold text-kidzy-purple">${item.dollarValue}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${item.name}"?`)) {
                              dispatch({ type: 'REMOVE_BEHAVIOR_ITEM', payload: item.id });
                            }
                          }}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowAddItem(cat.id)}
                      className="w-full p-2 border-2 border-dashed border-purple-200 rounded-lg text-kidzy-purple text-xs font-semibold hover:bg-purple-50 transition-colors"
                    >
                      <Plus size={12} className="inline mr-1" /> Add Behavior
                    </button>
                    {!cat.id.startsWith('cat_') || cat.items.length === 0 ? (
                      <button
                        onClick={() => {
                          if (confirm(`Delete the "${cat.name}" category?`)) {
                            dispatch({ type: 'REMOVE_BEHAVIOR_CATEGORY', payload: cat.id });
                            setExpandedCat(null);
                          }
                        }}
                        className="w-full p-2 text-red-400 text-xs font-semibold hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} className="inline mr-1" /> Delete Category
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Backup */}
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3"><Shield size={20} className="text-kidzy-gray" /> Data Backup</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <p className="text-sm text-kidzy-gray">Export your family data as a backup file, or restore from a previous backup.</p>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-kidzy-teal to-cyan-500 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-kidzy-blue to-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                <Upload size={16} /> Import
              </button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            {importStatus === 'success' && (
              <p className="text-green-600 text-sm text-center font-medium">Data restored successfully!</p>
            )}
            {importStatus === 'error' && (
              <p className="text-red-500 text-sm text-center font-medium">Failed to restore. Invalid backup file.</p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h3 className="font-bold text-red-700 mb-2">Reset Everything</h3>
          <p className="text-red-600 text-sm mb-3">This will permanently delete all family data. Export a backup first!</p>
          <button
            onClick={() => {
              if (confirm('Are you sure? This cannot be undone! Export a backup first.')) {
                if (confirm('Last chance! All data will be permanently deleted.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }
            }}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-xl text-sm"
          >
            Reset All Data
          </button>
        </div>
      </div>

      <AddParentModal isOpen={showAddParent} onClose={() => setShowAddParent(false)} />
      <AddCategoryModal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} />
      {showAddItem && <AddBehaviorItemModal isOpen={true} onClose={() => setShowAddItem(null)} categoryId={showAddItem} />}
    </div>
  );
}

function AddParentModal({ isOpen, onClose }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    dispatch({ type: 'ADD_PARENT', payload: { name: name.trim(), avatar } });
    setName(''); setAvatar(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Parent">
      <div className="flex justify-center mb-4">
        <Avatar src={avatar} name={name || 'P'} size="xl" editable onImageChange={setAvatar} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Name</label>
        <input type="text" placeholder="e.g., Mom, Dad, Alex" value={name} onChange={e => setName(e.target.value)} maxLength={50}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-teal focus:outline-none text-lg" />
      </div>
      <button onClick={handleAdd} disabled={!name.trim()}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-teal to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <UserPlus size={18} className="inline mr-1" /> Add Parent
      </button>
    </Modal>
  );
}

const CATEGORY_ICONS = ['\u{1F4AA}', '\u{1F9FC}', '\u{2B50}', '\u{1F4DA}', '\u{1F31F}', '\u{1F3AF}', '\u{1F3C3}', '\u{1F3A8}', '\u{1F9E0}', '\u{1F3B5}', '\u{2764}\u{FE0F}', '\u{1F333}'];

function AddCategoryModal({ isOpen, onClose }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('\u{2B50}');

  const handleAdd = () => {
    if (!name.trim()) return;
    dispatch({ type: 'ADD_BEHAVIOR_CATEGORY', payload: { name: name.trim(), icon, items: [] } });
    setName(''); setIcon('\u{2B50}');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Category">
      <div>
        <label className="block text-sm font-semibold mb-1">Icon</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORY_ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${icon === ic ? 'bg-purple-100 ring-2 ring-kidzy-purple scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}>
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Category Name</label>
        <input type="text" placeholder="e.g., Fitness, Social Skills" value={name} onChange={e => setName(e.target.value)} maxLength={30}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none" />
      </div>
      <button onClick={handleAdd} disabled={!name.trim()}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <Plus size={18} className="inline mr-1" /> Add Category
      </button>
    </Modal>
  );
}

function AddBehaviorItemModal({ isOpen, onClose, categoryId }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !value) return;
    dispatch({
      type: 'ADD_BEHAVIOR_ITEM',
      payload: { categoryId, item: { name: name.trim(), dollarValue: parseFloat(value), frequency: 'daily' } }
    });
    setName(''); setValue('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Behavior">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Behavior Name</label>
          <input type="text" placeholder="e.g., Practiced piano for 15 min" value={name} onChange={e => setName(e.target.value)} maxLength={60}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">K$ Value</label>
          <input type="number" placeholder="e.g., 3" value={value} onChange={e => setValue(e.target.value)} min="1" max="50"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none" />
        </div>
      </div>
      <button onClick={handleAdd} disabled={!name.trim() || !value}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <Plus size={18} className="inline mr-1" /> Add Behavior
      </button>
    </Modal>
  );
}
