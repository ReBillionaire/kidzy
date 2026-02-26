import { useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getDailyChallenges, checkChallengeProgress } from '../../utils/challenges';
import { getToday } from '../../utils/storage';
import { playAchievementSound, vibrateRedeem } from '../../utils/sounds';
import ProgressBar from '../shared/ProgressBar';

export default function DailyChallenges({ kidId }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const today = getToday();
  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;

  const challenges = useMemo(() => getDailyChallenges(today), [today]);

  const completedChallengeIds = useMemo(() => {
    return new Set((state.challenges || [])
      .filter(c => c.kidId === kidId && c.date === today)
      .map(c => c.challengeId));
  }, [state.challenges, kidId, today]);

  const handleClaimChallenge = (challenge) => {
    if (completedChallengeIds.has(challenge.id)) return;
    const progress = checkChallengeProgress(challenge, kidId, state.transactions);
    if (!progress.completed) return;

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId,
        parentId: state.currentParentId || 'system',
        type: 'earn',
        amount: challenge.reward,
        reason: `Challenge: ${challenge.name}`,
        category: 'Challenge',
      }
    });
    dispatch({
      type: 'COMPLETE_CHALLENGE',
      payload: { challengeId: challenge.id, kidId, date: today, reward: challenge.reward }
    });
    if (soundEnabled) playAchievementSound();
    if (hapticEnabled) vibrateRedeem();
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{'\u{1F3AF}'}</span>
        <h3 className="font-display font-bold text-kidzy-dark text-sm">Daily Challenges</h3>
        <span className="text-xs text-kidzy-gray ml-auto">Resets daily</span>
      </div>
      <div className="space-y-2">
        {challenges.map(challenge => {
          const isCompleted = completedChallengeIds.has(challenge.id);
          const progress = checkChallengeProgress(challenge, kidId, state.transactions);
          const canClaim = progress.completed && !isCompleted;

          return (
            <div
              key={challenge.id}
              className={`bg-white rounded-xl p-3 border transition-all ${
                isCompleted ? 'border-green-200 bg-green-50/50' : canClaim ? 'border-yellow-300 shadow-sm shadow-yellow-100' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{challenge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isCompleted ? 'text-green-700' : 'text-kidzy-dark'}`}>
                    {challenge.name}
                    {isCompleted && <span className="ml-1">{'\u{2705}'}</span>}
                  </p>
                  <p className="text-xs text-kidzy-gray">{challenge.description}</p>
                </div>
                {canClaim ? (
                  <button
                    onClick={() => handleClaimChallenge(challenge)}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm animate-pulse"
                  >
                    +${challenge.reward}
                  </button>
                ) : isCompleted ? (
                  <span className="text-green-600 font-bold text-xs">+${challenge.reward}</span>
                ) : (
                  <span className="text-kidzy-gray text-xs">${challenge.reward}</span>
                )}
              </div>
              {!isCompleted && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar
                      value={progress.current}
                      max={progress.target}
                      color={canClaim ? '#F59E0B' : '#7C3AED'}
                      height="h-1.5"
                      showLabel={false}
                    />
                  </div>
                  <span className="text-xs text-kidzy-gray font-medium">{progress.current}/{progress.target}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
