import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { compressImage } from '../../utils/helpers';

const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#F97316', '#14B8A6', '#EF4444'];

export default function Avatar({ src, name, size = 'md', editable = false, onImageChange, className = '' }) {
  const fileRef = useRef(null);
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl', xl: 'w-24 h-24 text-4xl' };
  const colorIndex = name ? name.charCodeAt(0) % COLORS.length : 0;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      const compressed = await compressImage(file);
      onImageChange(compressed);
    }
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`} />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-white`}
          style={{ backgroundColor: COLORS[colorIndex] }}
        >
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-kidzy-purple text-white rounded-full flex items-center justify-center shadow-lg hover:bg-kidzy-purple-dark transition-colors"
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </>
      )}
    </div>
  );
}
