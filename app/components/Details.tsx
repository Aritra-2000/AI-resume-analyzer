import { cn } from "~/lib/utils";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "./Accordion";
import { getScoreTier } from "./ScoreBadge";

const safeNum = (n: number | undefined | null): number =>
    Math.max(0, Math.min(100, Math.round(n || 0)));

const ScoreBadge = ({ score }: { score: number }) => {
    const safeScore = safeNum(score);
    const tier = getScoreTier(safeScore);
    return (
        <div
            className={cn(
                "flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px]",
                tier === "good"    ? "bg-badge-green" :
                tier === "average" ? "bg-badge-yellow" :
                                     "bg-badge-red"
            )}
        >
            <img
                src={tier === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt="score"
                className="size-4"
            />
            <p
                className={cn(
                    "text-sm font-medium",
                    tier === "good"    ? "text-badge-green-text" :
                    tier === "average" ? "text-badge-yellow-text" :
                                         "text-badge-red-text"
                )}
            >
                {safeScore}/100
            </p>
        </div>
    );
};

const CategoryHeader = ({
    title,
    categoryScore,
}: {
    title: string;
    categoryScore: number;
}) => (
    <div className="flex flex-row gap-4 items-center py-2">
        <p className="text-2xl font-semibold">{title}</p>
        <ScoreBadge score={categoryScore} />
    </div>
);

type Tip = {
    type: "good" | "improve";
    tip: string;
    explanation?: string;
};

const CategoryContent = ({ tips }: { tips: Tip[] }) => (
    <div className="flex flex-col gap-4 items-center w-full">
        <div className="bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4">
            {tips.map((tip, index) => (
                <div className="flex flex-row gap-2 items-center" key={index}>
                    <img
                        src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                        alt="score"
                        className="size-5"
                    />
                    <p className="text-xl text-gray-500">{tip.tip}</p>
                </div>
            ))}
        </div>
        <div className="flex flex-col gap-4 w-full">
            {tips.map((tip, index) => (
                <div
                    key={index + tip.tip}
                    className={cn(
                        "flex flex-col gap-2 rounded-2xl p-4",
                        tip.type === "good"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                    )}
                >
                    <div className="flex flex-row gap-2 items-center">
                        <img
                            src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                            alt="score"
                            className="size-5"
                        />
                        <p className="text-xl font-semibold">{tip.tip}</p>
                    </div>
                    {/* explanation is optional (ATS tips may not have it) */}
                    {tip.explanation && <p>{tip.explanation}</p>}
                </div>
            ))}
        </div>
    </div>
);

const Details = ({ feedback }: { feedback: Feedback }) => (
    <div className="flex flex-col gap-4 w-full">
        <Accordion>
            <AccordionItem id="tone-style">
                <AccordionHeader itemId="tone-style">
                    <CategoryHeader title="Tone & Style" categoryScore={safeNum(feedback.toneAndStyle?.score)} />
                </AccordionHeader>
                <AccordionContent itemId="tone-style">
                    <CategoryContent tips={feedback.toneAndStyle?.tips ?? []} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem id="content">
                <AccordionHeader itemId="content">
                    <CategoryHeader title="Content" categoryScore={safeNum(feedback.content?.score)} />
                </AccordionHeader>
                <AccordionContent itemId="content">
                    <CategoryContent tips={feedback.content?.tips ?? []} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem id="structure">
                <AccordionHeader itemId="structure">
                    <CategoryHeader title="Structure" categoryScore={safeNum(feedback.structure?.score)} />
                </AccordionHeader>
                <AccordionContent itemId="structure">
                    <CategoryContent tips={feedback.structure?.tips ?? []} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem id="skills">
                <AccordionHeader itemId="skills">
                    <CategoryHeader title="Skills" categoryScore={safeNum(feedback.skills?.score)} />
                </AccordionHeader>
                <AccordionContent itemId="skills">
                    <CategoryContent tips={feedback.skills?.tips ?? []} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
);

export default Details;
