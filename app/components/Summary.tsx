import ScoreBadge, { getScoreTier } from "./ScoreBadge";
import ScoreGauge from "./ScoreGauge";

/** Safe score that clamps nullish/out-of-range AI values to [0, 100] */
const safeNum = (n: number | undefined | null): number =>
    Math.max(0, Math.min(100, Math.round(n || 0)));

const Category = ({ title, score }: { title: string; score: number }) => {
    const safe = safeNum(score);
    const tier = getScoreTier(safe);
    const textColor =
        tier === "good"    ? "text-green-600" :
        tier === "average" ? "text-yellow-600" : "text-red-600";

    return (
        <div className="resume-summary">
            <div className="category">
                <div className="flex flex-row gap-2 items-center justify-center">
                    <p className="text-2xl">{title}</p>
                    <ScoreBadge score={safe} />
                </div>
                <p className="text-2xl">
                    <span className={textColor}>{safe}</span>/100
                </p>
            </div>
        </div>
    );
};

/**
 * Computes a weighted overall score from the 5 sub-scores.
 * This is deterministic and cannot be inflated by the AI.
 *
 * Weights:
 *   ATS        35%  ← most important for getting past filters
 *   Content    25%
 *   Skills     20%
 *   Structure  12%
 *   Tone/Style  8%
 */
function computeOverallScore(feedback: Feedback): number {
    const ats       = safeNum(feedback.ATS?.score);
    const content   = safeNum(feedback.content?.score);
    const skills    = safeNum(feedback.skills?.score);
    const structure = safeNum(feedback.structure?.score);
    const tone      = safeNum(feedback.toneAndStyle?.score);

    return Math.round(
        ats * 0.35 + content * 0.25 + skills * 0.20 + structure * 0.12 + tone * 0.08
    );
}

const Summary = ({ feedback }: { feedback: Feedback }) => {
    const computedScore = computeOverallScore(feedback);

    // Dev-only warning when AI score diverges significantly
    if (process.env.NODE_ENV !== "production" && feedback.overallScore != null) {
        const diff = Math.abs(feedback.overallScore - computedScore);
        if (diff > 15) {
            console.warn(
                `[ScoreAudit] AI overallScore (${feedback.overallScore}) diverges from computed (${computedScore}) by ${diff} pts. Using computed.`
            );
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGauge score={computedScore} />
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Your Resume Score</h2>
                    <p className="text-sm text-gray-500">
                        Weighted from 5 categories: ATS (35%), Content (25%), Skills (20%), Structure (12%), Tone (8%).
                    </p>
                </div>
            </div>

            {/* All 5 categories including ATS */}
            <Category title="ATS"         score={safeNum(feedback.ATS?.score)} />
            <Category title="Content"     score={safeNum(feedback.content?.score)} />
            <Category title="Skills"      score={safeNum(feedback.skills?.score)} />
            <Category title="Structure"   score={safeNum(feedback.structure?.score)} />
            <Category title="Tone & Style" score={safeNum(feedback.toneAndStyle?.score)} />
        </div>
    );
};

export default Summary;
