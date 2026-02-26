import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import Modal from '../shared/Modal';
import Avatar from '../shared/Avatar';
import { ArrowLeft, UserPlus, Edit3, Trash2, Users, Baby, Shield, Palette, ChevronRight } from 'lucide-react';

export default function SettingsPage({ onBack }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showAddParent, setShowAddParent] = useState(false);
  const [editingKid, setEditingKid] = useState(null);

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
            {state.kids.map(kid => (
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

        {/* Behavior Settings */}
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-3"><Palette size={20} className="text-kidzy-purple" /> Behavior Categories</h2>
          <div className="space-y-2">
            {state.behaviorCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-semibold flex-1">{cat.name}</span>
                  <span className="text-xs text-kidzy-gray">{cat.items.length} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-display font-bold flex items-center gap-2 mb-2"><Shield size={18} className="text-kidzy-gray" /> Account</h3>
          <p className="text-sm text-kidzy-gray">Family PIN protects parent access. Kids can view their dashboard but only parents can earn/deduct K$.</p>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h3 className="font-bold text-red-700 mb-2">Reset Everything</h3>
          <p className="text-red-600 text-sm mb-3">This will permanently delete all family data.</p>
          <button
            onClick={() => {
              if (confirm('Are you sure? This cannot be undone!')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-xl text-sm"
          >
            Reset All Data
          </button>
        </div>
      </div>

      <AddParentModal isOpen={showAddParent} onClose={() => setShowAddParent(false)} />
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
        <input type="text" placeholder="e.g., Mom, Dad, Alex" value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-teal focus:outline-none text-lg" />
      </div>
      <button onClick={handleAdd} disabled={!name.trim()}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-teal to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <UserPlus size={18} className="inline mr-1" /> Add Parent
      </button>
    </Modal>
  );
        }
