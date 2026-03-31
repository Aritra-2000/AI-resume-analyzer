import { useEffect, useRef, useState } from "react";

const ScoreGauge = ({ score = 0 }: { score: number }) => {
  // Clamp to valid range to prevent NaN/overflow rendering
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const percentage = safeScore / 100;

  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Color-coded gradient zones matching unified thresholds (≥70 green, ≥50 yellow, <50 red)
  const gradientColors =
    safeScore >= 70
      ? { from: "#22c55e", to: "#16a34a" }   // green
      : safeScore >= 50
      ? { from: "#f59e0b", to: "#d97706" }   // amber
      : { from: "#ef4444", to: "#dc2626" };  // red

  const scoreLabel =
    safeScore >= 70 ? "Strong" :
    safeScore >= 50 ? "Good Start" : "Needs Work";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors.from} />
              <stop offset="100%" stopColor={gradientColors.to} />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Score arc */}
          <path
            ref={pathRef}
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength * (1 - percentage)}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="text-xl font-bold pt-4">{safeScore}/100</div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{scoreLabel}</p>
    </div>
  );
};

export default ScoreGauge;