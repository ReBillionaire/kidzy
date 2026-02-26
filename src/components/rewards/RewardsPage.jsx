import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getWishListProgress } from '../../utils/helpers';
import Modal from '../shared/Modal';
import ProgressBar from '../shared/ProgressBar';
import ConfettiEffect from '../shared/ConfettiEffect';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import { compressImage } from '../../utils/helpers';
import { ArrowLeft, Plus, Gift, Star, Trash2, Unlock, ImagePlus, Mountain, Bike, Tent, Gamepad2, ShoppingBag, CheckCircle2, Clock } from 'lucide-react';
import { useRef } from 'react';

const WISH_ICONS = ['🎮', '🚲', '⛺', '🎯', '📱', '🎨', '🏀', '🎸', '👟', '🎪', '🎢', '🐕', '🍦', '📚', '🎭', '✈️'];

export default function RewardsPage({ onBack, selectedKidId }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showAddWish, setShowAddWish] = useState(false);
  const [showAddDream, setShowAddDream] = useState(false);
  const [activeKid, setActiveKid] = useState(selectedKidId || state.kids[0]?.id);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tab, setTab] = useState('wishes'); // wishes, dreams

  const kid = state.kids.find(k => k.id === activeKid);
  const balance = kid ? getKidBalance(kid.id, state.transactions) : 0;
  const wishes = state.wishListItems.filter(w => w.kidId === activeKid && w.status === 'active');
  const redeemedWishes = state.wishListItems.filter(w => w.kidId === activeKid && w.status === 'redeemed');
  const dreams = state.dreamGoals.filter(d => d.kidId === activeKid && d.status === 'active');

  const handleRedeem = (wish) => {
    if (balance < wish.targetDollars) return;
    dispatch({
      type: 'REDEEM_WISH',
      payload: { wishId: wish.id, kidId: activeKid, amount: wish.targetDollars, wishName: wish.name }
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  return (
    <div className="pb-24">
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-pink to-kidzy-orange text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 bg-white/15 rounded-full">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-display font-bold">Rewards & Dreams</h1>
        </div>

        {/* Kid selector */}
        {state.kids.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {state.kids.map(k => (
              <button
                key={k.id}
                onClick={() => setActiveKid(k.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeKid === k.id ? 'bg-white text-kidzy-pink shadow-md' : 'bg-white/20 text-white'
                }`}
              >
                <Avatar src={k.avatar} name={k.name} size="sm" />
                {k.name}
              </button>
            ))}
          </div>
        )}

        {kid && (
          <div className="mt-3 text-center">
            <p className="text-white/80 text-sm">{kid.name}'s Balance</p>
            <p className="text-4xl font-display font-bold">${balance} <span className="text-lg">K$</span></p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4 mb-4">
        {[
          { key: 'wishes', label: 'Wish List', icon: '🎁' },
          { key: 'dreams', label: 'Dream Goals', icon: '🌟' },
          { key: 'unlocked', label: 'Unlocked', icon: '🏆' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-kidzy-pink text-white shadow-md' : 'bg-white text-kidzy-gray hover:bg-pink-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'wishes' && (
          <>
            {wishes.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl">
                <div className="text-5xl mb-3">🎁</div>
                <h3 className="font-display font-bold text-lg">No wishes yet!</h3>
                <p className="text-kidzy-gray text-sm mb-4">Add things to work towards</p>
                <button onClick={() => setShowAddWish(true)} className="bg-gradient-to-r from-kidzy-pink to-kidzy-orange text-white font-bold py-2.5 px-6 rounded-xl shadow-md">
                  <Plus size={16} className="inline mr-1" /> Add Wish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {wishes.map(wish => (
                  <WishCard key={wish.id} wish={wish} balance={balance} onRedeem={() => handleRedeem(wish)} onRemove={() => dispatch({ type: 'REMOVE_WISH', payload: wish.id })} />
                ))}
                <button onClick={() => setShowAddWish(true)} className="w-full p-3 border-2 border-dashed border-pink-300 rounded-xl text-kidzy-pink font-semibold text-sm hover:bg-pink-50 transition-colors">
                  <Plus size={16} className="inline mr-1" /> Add Another Wish
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'dreams' && (
          <>
            {dreams.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl">
                <div className="text-5xl mb-3">🌟</div>
                <h3 className="font-display font-bold text-lg">No dream goals yet!</h3>
                <p className="text-kidzy-gray text-sm mb-4">Add big aspirations to dream about</p>
                <button onClick={() => setShowAddDream(true)} className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md">
                  <Plus size={16} className="inline mr-1" /> Add Dream Goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dreams.map(dream => (
                  <DreamCard key={dream.id} dream={dream} balance={balance} onRemove={() => dispatch({ type: 'REMOVE_DREAM', payload: dream.id })} />
                ))}
                <button onClick={() => setShowAddDream(true)} className="w-full p-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 font-semibold text-sm hover:bg-amber-50 transition-colors">
                  <Plus size={16} className="inline mr-1" /> Add Another Dream
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'unlocked' && (
          <>
            {redeemedWishes.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl">
                <div className="text-5xl mb-3">🏆</div>
                <h3 className="font-display font-bold text-lg">Nothing unlocked yet</h3>
                <p className="text-kidzy-gray text-sm">Keep earning to unlock awesome rewards!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pending fulfillment */}
                {redeemedWishes.filter(w => !w.fulfilled).length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1 mb-2"><Clock size={14} /> Awaiting Fulfillment</h4>
                    {redeemedWishes.filter(w => !w.fulfilled).map(wish => (
                      <div key={wish.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3 mb-2">
                        {wish.image ? (
                          <img src={wish.image} className="w-14 h-14 rounded-xl object-cover" alt="" />
                        ) : (
                          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">{wish.icon || '🎁'}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-amber-800">{wish.name}</p>
                          <p className="text-amber-600 text-xs">Redeemed — not yet given</p>
                        </div>
                        <button
                          onClick={() => dispatch({ type: 'FULFILL_WISH', payload: wish.id })}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Mark Given
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Fulfilled */}
                {redeemedWishes.filter(w => w.fulfilled).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-2"><CheckCircle2 size={14} /> Fulfilled</h4>
                    {redeemedWishes.filter(w => w.fulfilled).map(wish => (
                      <div key={wish.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3 mb-2">
                        {wish.image ? (
                          <img src={wish.image} className="w-14 h-14 rounded-xl object-cover" alt="" />
                        ) : (
                          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">{wish.icon || '🎁'}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-green-800">{wish.name}</p>
                          <p className="text-green-600 text-xs">Given!</p>
                        </div>
                        <span className="text-2xl">✅</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AddWishModal isOpen={showAddWish} onClose={() => setShowAddWish(false)} kidId={activeKid} />
      <AddDreamModal isOpen={showAddDream} onClose={() => setShowAddDream(false)} kidId={activeKid} />
    </div>
  );
}

function WishCard({ wish, balance, onRedeem, onRemove }) {
  const progress = getWishListProgress(wish, balance);
  const canRedeem = balance >= wish.targetDollars;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${canRedeem ? 'border-green-300 shadow-green-100' : 'border-gray-100'}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {wish.image ? (
            <img src={wish.image} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt="" />
          ) : (
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">{wish.icon || '🎁'}</div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-kidzy-dark truncate">{wish.name}</h4>
            <DollarBadge amount={wish.targetDollars} size="sm" />
          </div>
          <button onClick={onRemove} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
        <ProgressBar value={Math.min(balance, wish.targetDollars)} max={wish.targetDollars} color={canRedeem ? '#10B981' : '#EC4899'} />
        {canRedeem && (
          <button
            onClick={onRedeem}
            className="w-full mt-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Unlock size={16} /> Redeem Now!
          </button>
        )}
      </div>
    </div>
  );
}

function DreamCard({ dream, balance, onRemove }) {
  const progress = getWishListProgress(dream, balance);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-sm border-2 border-amber-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {dream.image ? (
            <img src={dream.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
          ) : (
            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">{dream.icon || '🌟'}</div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-kidzy-dark truncate">{dream.name}</h4>
            {dream.description && <p className="text-kidzy-gray text-xs truncate">{dream.description}</p>}
            <DollarBadge amount={dream.targetDollars} size="sm" />
          </div>
          <button onClick={onRemove} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
        <ProgressBar value={Math.min(balance, dream.targetDollars)} max={dream.targetDollars} color="#F59E0B" />
      </div>
    </div>
  );
}

function AddWishModal({ isOpen, onClose, kidId }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setImage(compressed);
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !target) return;
    dispatch({
      type: 'ADD_WISH',
      payload: { kidId, name: name.trim(), targetDollars: parseFloat(target), icon, image }
    });
    setName(''); setTarget(''); setIcon('🎁'); setImage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Wish List">
      <div className="space-y-4">
        {/* Image upload */}
        <div className="flex justify-center">
          {image ? (
            <div className="relative">
              <img src={image} className="w-24 h-24 rounded-xl object-cover shadow-md" alt="" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 bg-pink-50 border-2 border-dashed border-pink-300 rounded-xl flex flex-col items-center justify-center text-pink-400 hover:bg-pink-100 transition-colors"
            >
              <ImagePlus size={24} />
              <span className="text-xs mt-1">Add Photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Icon selector */}
        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">Pick an Icon</label>
          <div className="flex flex-wrap gap-2">
            {WISH_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                  icon === ic ? 'bg-pink-100 ring-2 ring-kidzy-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">What do they want?</label>
          <input type="text" placeholder="e.g., New bicycle, Trip to zoo" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-pink focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-kidzy-dark mb-1">K$ needed to unlock</label>
          <input type="number" placeholder="e.g., 100" value={target} onChange={e => setTarget(e.target.value)} min="1"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kidzy-pink focus:outline-none" />
        </div>
      </div>
      <button onClick={handleAdd} disabled={!name.trim() || !target}
        className="w-full mt-6 bg-gradient-to-r from-kidzy-pink to-kidzy-orange text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <Gift size={18} className="inline mr-1" /> Add Wish
      </button>
    </Modal>
  );
}

function AddDreamModal({ isOpen, onClose, kidId }) {
  const dispatch = useKidzyDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🌟');
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setImage(compressed);
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !target) return;
    dispatch({
      type: 'ADD_DREAM',
      payload: { kidId, name: name.trim(), description: description.trim(), targetDollars: parseFloat(target), icon, image }
    });
    setName(''); setDescription(''); setTarget(''); setIcon('🌟'); setImage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Dream Goal">
      <div className="space-y-4">
        <div className="flex justify-center">
          {image ? (
            <div className="relative">
              <img src={image} className="w-24 h-24 rounded-xl object-cover shadow-md" alt="" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl flex flex-col items-center justify-center text-amber-400 hover:bg-amber-100 transition-colors"
            >
              <ImagePlus size={24} />
              <span className="text-xs mt-1">Add Photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Dream Name</label>
          <input type="text" placeholder="e.g., Go camping, Own a guitar" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Description (optional)</label>
          <textarea placeholder="Describe the dream..." value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">K$ needed</label>
          <input type="number" placeholder="e.g., 500" value={target} onChange={e => setTarget(e.target.value)} min="1"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none" />
        </div>
      </div>
      <button onClick={handleAdd} disabled={!name.trim() || !target}
        className="w-full mt-6 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
        <Star size={18} className="inline mr-1" /> Add Dream Goal
      </button>
    </Modal>
  );
}
