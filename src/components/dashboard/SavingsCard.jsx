import { useState, useEffect } from 'react';
import { PiggyBank, ShoppingBag, Heart, Wallet } from 'lucide-react';

export default function SavingsCard({ balance, allocation = { save: 40, spend: 40, give: 20 } }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const pots = [
    {
      name: 'Save',
      icon: PiggyBank,
      percent: allocation.save,
      amount: Math.round(balance * (allocation.save / 100)),
      color: 'emerald',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      ringColor: '#10B981',
    },
    {
      name: 'Spend',
      icon: ShoppingBag,
      percent: allocation.spend,
      amount: Math.round(balance * (allocation.spend / 100)),
      color: 'blue',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
      ringColor: '#3B82F6',
    },
    {
      name: 'Give',
      icon: Heart,
      percent: allocation.give,
      amount: Math.round(balance * (allocation.give / 100)),
      color: 'pink',
      lightBg: 'bg-pink-50',
      textColor: 'text-pink-700',
      ringColor: '#EC4899',
    },
  ];

  // SVG circular progress
  const CircleProgress = ({ percent, color, size = 80 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animated ? (percent / 100) * circumference : 0);

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-pink-50 p-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-kidzy-dark flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Wallet size={14} className="text-white" />
            </div>
            My Money Pots
          </h2>
          <span className="text-sm font-bold text-kidzy-purple">{balance} K$</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {pots.map(pot => {
            const Icon = pot.icon;
            return (
              <div key={pot.name} className="text-center">
                <div className="relative inline-block mb-2">
                  <CircleProgress percent={pot.percent} color={pot.ringColor} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-12 h-12 ${pot.lightBg} rounded-full flex items-center justify-center`}>
                      <Icon size={20} className={pot.textColor} />
                    </div>
                  </div>
                </div>
                <p className={`text-lg font-display font-black ${pot.textColor}`}>{pot.amount}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{pot.name}</p>
                <p className="text-[10px] text-gray-300">{pot.percent}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
