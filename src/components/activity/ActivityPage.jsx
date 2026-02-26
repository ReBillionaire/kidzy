import { useState, useMemo } from 'react';
import { useKidzy } from '../../context/KidzyContext';
import { formatDate, formatTime } from '../../utils/storage';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import { ArrowLeft, Filter, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function ActivityPage({ onBack }) {
  const state = useKidzy();
  const [filterKid, setFilterKid] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const transactions = useMemo(() => {
    let txns = [...state.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filterKid !== 'all') txns = txns.filter(t => t.kidId === filterKid);
    if (filterType !== 'all') txns = txns.filter(t => t.type === filterType);
    return txns;
  }, [state.transactions, filterKid, filterType]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    transactions.forEach(tx => {
      const date = tx.timestamp.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [transactions]);

  const getParentName = (parentId) => state.parents.find(p => p.id === parentId)?.name || 'Unknown';
  const getKidName = (kidId) => state.kids.find(k => k.id === kidId)?.name || 'Unknown';
  const getKid = (kidId) => state.kids.find(k => k.id === kidId);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-blue to-indigo-500 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-display font-bold">Activity Log</h1>
        </div>
        <p className="text-blue-100 text-sm">Track who gave, deducted, or redeemed K$</p>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
        <select
          value={filterKid}
          onChange={e => setFilterKid(e.target.value)}
          className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-kidzy-blue focus:outline-none"
        >
          <option value="all">All Kids</option>
          {state.kids.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-kidzy-blue focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="earn">Earned</option>
          <option value="deduct">Deducted</option>
          <option value="redeem">Redeemed</option>
        </select>
      </div>

      {/* Transactions */}
      <div className="px-4 mt-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-display font-bold text-lg">No activity yet</h3>
            <p className="text-kidzy-gray text-sm">Start tracking behaviors to see activity here</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txns]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-semibold text-kidzy-gray mb-2 sticky top-0 bg-kidzy-bg py-1 z-10">{formatDate(date)}</h3>
              <div className="space-y-2">
                {txns.map(tx => {
                  const kid = getKid(tx.kidId);
                  return (
                    <div key={tx.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'earn' ? 'bg-green-100' : tx.type === 'deduct' ? 'bg-red-100' : 'bg-purple-100'
                      }`}>
                        {tx.type === 'earn' ? <TrendingUp size={18} className="text-green-600" /> :
                         tx.type === 'deduct' ? <TrendingDown size={18} className="text-red-600" /> :
                         <RefreshCw size={18} className="text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Avatar src={kid?.avatar} name={kid?.name || '?'} size="sm" />
                          <span className="font-semibold text-sm truncate">{getKidName(tx.kidId)}</span>
                        </div>
                        <p className="text-xs text-kidzy-gray truncate">{tx.reason}</p>
                        <p className="text-xs text-kidzy-gray/60">by {getParentName(tx.parentId)} at {formatTime(tx.timestamp)}</p>
                      </div>
                      <DollarBadge
                        amount={tx.amount}
                        size="sm"
                        showPlus={tx.type === 'earn'}
                        negative={tx.type !== 'earn'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
      }
