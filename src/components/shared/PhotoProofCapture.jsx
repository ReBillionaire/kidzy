import { useState, useRef } from 'react';
import { Camera, X, CheckCircle2 } from 'lucide-react';

export default function PhotoProofCapture({ onCapture, onClear, currentPhoto }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const compressImage = (file, maxWidth = 400, quality = 0.6) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      // Compress image to save localStorage space
      const compressed = await compressImage(file, 400, 0.6);
      onCapture(compressed);
    } catch (err) {
      console.error('Photo capture failed:', err);
    }
    setLoading(false);
    // Reset input so same file can be selected again
    if (fileRef.current) fileRef.current.value = '';
  };

  if (currentPhoto) {
    return (
      <div className="relative inline-block">
        <img
          src={currentPhoto}
          alt="Proof"
          className="w-20 h-20 object-cover rounded-xl border-2 border-green-300 shadow-md"
        />
        <button
          onClick={onClear}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
        >
          <X size={12} />
        </button>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
          <CheckCircle2 size={10} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <>
            <Camera size={14} />
            <span>Add Photo</span>
          </>
        )}
      </button>
    </div>
  );
}
