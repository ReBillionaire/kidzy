import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';
import { LogIn, Users } from 'lucide-react';

/**
 * LoginScreen — shown when a family is loaded but no parent is logged in.
 * Parent selects their profile or kids pick theirs.
 * Auth is already done at the Firebase level — this just picks the local parent.
 */
export default function LoginScreen() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const { user } = useAuth();
  const [isKidMode, setIsKidMode] = useState(false);

  // ── Kid Mode ──────────────────────────────────────────────────────
  if (isKidMode) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">&#127775;</div>
            <h1 className="text-2xl font-display font-bold text-kidzy-dark">Hey there!</h1>
            <p className="text-kidzy-gray mt-1">Pick your name to see your dashboard</p>
          </div>

          <div className="space-y-2">
            {state.kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => dispatch({ type: 'SET_KID_MODE', payload: kid.id })}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 transition-all text-left"
              >
                <Avatar src={kid.avatar} name={kid.name} size="md" />
                <span className="font-bold text-kidzy-dark">{kid.name}</span>
                {kid.age && <span className="text-kidzy-gray text-sm ml-auto">Age {kid.age}</span>}
              </button>
            ))}
          </div>

          {state.kids.length === 0 && (
            <p className="text-center text-kidzy-gray text-sm py-4">No kids added yet. Ask a parent to add you!</p>
          )}

          <button
            onClick={() => setIsKidMode(false)}
            className="w-full mt-4 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors font-medium"
          >
            &#8592; Back to Parent Login
          </button>
        </div>
      </div>
    );
  }

  // ── Parent Selection ──────────────────────────────────────────────
  // Match the Firebase user to a parent profile
  const myParent = user ? state.parents.find(p => p.uid === user.uid) : null;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">&#11088;</div>
          <h1 className="text-3xl font-display font-bold text-kidzy-dark">Kidzy</h1>
          <p className="text-kidzy-gray mt-1">{state.family?.name}</p>
        </div>

        {/* If user matches a parent, auto-login button */}
        {myParent ? (
          <button
            onClick={() => dispatch({ type: 'SET_CURRENT_PARENT', payload: myParent.id })}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 border-2 border-kidzy-purple/20 rounded-2xl hover:border-kidzy-purple/40 hover:shadow-md transition-all mb-4"
          >
            <Avatar src={myParent.avatar} name={myParent.name} size="md" />
            <div className="flex-1 text-left">
              <p className="font-bold text-kidzy-dark">Continue as {myParent.name}</p>
              <p className="text-xs text-kidzy-gray">{user.email}</p>
            </div>
            <LogIn size={20} className="text-kidzy-purple" />
          </button>
        ) : (
          <>
            {/* Show all parents to pick from */}
            <p className="text-sm font-semibold text-kidzy-dark mb-3 flex items-center gap-2">
              <Users size={16} /> Select your profile
            </p>
            <div className="space-y-2 mb-4">
              {state.parents.map(parent => (
                <button
                  key={parent.id}
                  onClick={() => dispatch({ type: 'SET_CURRENT_PARENT', payload: parent.id })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-kidzy-purple/30 hover:bg-purple-50/50 transition-all text-left"
                >
                  <Avatar src={parent.avatar} name={parent.name} size="md" />
                  <div className="flex-1">
                    <span className="font-bold text-kidzy-dark">{parent.name}</span>
                    {parent.email && <p className="text-xs text-kidzy-gray">{parent.email}</p>}
                  </div>
                  <span className="text-xs text-kidzy-gray">{parent.role}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Kid Mode */}
        {state.kids.length > 0 && (
          <button
            onClick={() => setIsKidMode(true)}
            className="w-full py-2.5 text-sm font-semibold text-kidzy-purple hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            &#129490; I'm a Kid
          </button>
        )}
      </div>
    </div>
  );
}
