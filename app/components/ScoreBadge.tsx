interface ScoreBadgeProps {
  score: number;
}

// Unified thresholds used consistently across all scoring components:
//   ≥ 70 → Strong (green)
//   ≥ 50 → Good Start (yellow)
//   < 50 → Needs Work (red)
export const getScoreTier = (score: number): 'good' | 'average' | 'poor' => {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 70) return 'good';
  if (s >= 50) return 'average';
  return 'poor';
};

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  const tier = getScoreTier(score);

  const badgeColor =
    tier === 'good'    ? 'bg-badge-green text-green-600' :
    tier === 'average' ? 'bg-badge-yellow text-yellow-600' :
                         'bg-badge-red text-red-600';

  const badgeText =
    tier === 'good'    ? 'Strong' :
    tier === 'average' ? 'Good Start' :
                         'Needs Work';

  return (
    <div className={`px-3 py-1 rounded-full ${badgeColor}`}>
      <p className="text-sm font-medium">{badgeText}</p>
    </div>
  );
};

export default ScoreBadge;
