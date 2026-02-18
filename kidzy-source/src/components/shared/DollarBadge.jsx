export default function DollarBadge({ amount, size = 'md', showPlus = false, negative = false }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
    xl: 'text-xl px-5 py-2',
  };

  const colorClasses = negative
    ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
    : 'bg-gradient-to-r from-yellow-100 to-amber-200 text-amber-800';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${colorClasses} font-bold rounded-full whitespace-nowrap`}>
      {negative ? '−' : showPlus ? '+' : ''}${Math.abs(amount).toFixed(0)}
      <span className="text-[0.7em]">K$</span>
    </span>
  );
}
