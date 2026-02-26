import { Home, Medal, Gift, ScrollText, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'leaderboard', label: 'Board', icon: Medal },
  { key: 'rewards', label: 'Rewards', icon: Gift },
  { key: 'activity', label: 'Activity', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                isActive ? 'text-kidzy-purple' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-kidzy-purple/10' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-kidzy-purple' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
