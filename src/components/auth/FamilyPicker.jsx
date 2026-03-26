import { useAuth } from '../../context/AuthContext';
import { Users, Plus, LogOut } from 'lucide-react';

/**
 * FamilyPicker — shown when user belongs to multiple families.
 * Let them pick which family dashboard to open.
 */
export default function FamilyPicker() {
  const { families, setCurrentFamilyId, signOut, user } = useAuth();

  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">&#128106;</div>
          <h2 className="text-2xl font-display font-bold text-kidzy-dark">Your Families</h2>
          <p className="text-kidzy-gray mt-1">Pick a family to open</p>
        </div>

        <div className="space-y-2 mb-4">
          {families.map(family => (
            <button
              key={family.id}
              onClick={() => setCurrentFamilyId(family.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-kidzy-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-kidzy-purple" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-kidzy-dark">{family.name}</p>
                <p className="text-xs text-kidzy-gray">
                  {family.parents?.length || 0} parent{(family.parents?.length || 0) !== 1 ? 's' : ''} &middot; {family.kids?.length || 0} kid{(family.kids?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => signOut()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-kidzy-gray hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
