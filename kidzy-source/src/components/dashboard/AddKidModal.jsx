import { useState } from 'react';
import { useKidzyDispatch } from '../../context/KidzyContext';
import Modal from '../shared/Modal';
import Avatar from '../shared/Avatar';
import { UserPlus } from 'lucide-react';

export default function AddKidModal({ isOpen, onClose }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    dispatch({
      type: 'ADD_KID',
      payload: { name: name.trim(), age: age ? parseInt(age) : null, avatar }
    });
    setName('');
    setAge('');
    setAvatar(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a Kid">
      <div className="flex justify-center mb-4">
        <Avatar src={avatar} name={name || 'K'} size="xl" editable onImageChange={setAvatar} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Name</label>
          <input
            type="text"
            placeholder="e.g., Emma, Liam"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Age (optional)</label>
          <input
            type="number"
            placeholder="e.g., 8"
            value={age}
            onChange={e => setAge(e.target.value)}
            min="1"
            max="18"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-purple focus:outline-none text-lg transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl transition-all"
      >
        <UserPlus size={18} /> Add Kid
      </button>
    </Modal>
  );
}
