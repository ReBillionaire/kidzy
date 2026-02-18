import { useEffect, useState } from 'react';

const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#F97316', '#FF6B6B', '#FFD93D'];

export default function ConfettiEffect({ active, duration = 2000 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => setPieces([]), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${1.5 + Math.random()}s linear ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
