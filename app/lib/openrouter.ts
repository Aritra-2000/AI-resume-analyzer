import { AIResponseFormat } from "~/constants";

// Free vision-capable models on OpenRouter (no billing required)
// Listed in priority order — best quality first
export const FREE_VISION_MODELS = [
    { id: "meta-llama/llama-3.2-90b-vision-instruct:free", label: "Llama 3.2 90B Vision (Free)" },
    { id: "meta-llama/llama-3.2-11b-vision-instruct:free", label: "Llama 3.2 11B Vision (Free)" },
    { id: "google/gemini-2.0-flash-exp:free",               label: "Gemini 2.0 Flash Exp (Free)" },
    { id: "qwen/qwen2-vl-72b-instruct:free",                label: "Qwen2 VL 72B (Free)" },
];

export async function analyzeResumeWithOpenRouter(
    imageBlob: Blob,
    jobTitle: string,
    jobDescription: string,
    apiKey: string,
    model: string = FREE_VISION_MODELS[0].id
) {
    const base64Image = await blobToBase64(imageBlob);

    const prompt = `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze and rate this resume and suggest how to improve it.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as a JSON object, without any other text and without markdown backticks.`;

    // If the chosen model is a free vision model, try the full fallback chain
    const modelsToTry = FREE_VISION_MODELS.some(m => m.id === model)
        ? [model, ...FREE_VISION_MODELS.map(m => m.id).filter(id => id !== model)]
        : [model];

    let lastError: Error | null = null;

    for (const currentModel of modelsToTry) {
        try {
            console.log(`OpenRouter: trying model "${currentModel}"`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "AI Resume Analyzer",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: base64Image } },
                            ],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error?.message || `OpenRouter request failed (${response.status})`);
            }

            const data = await response.json();
            let text: string = data.choices[0].message.content;
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            // Extract JSON from response (handles conversational prefixes)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error(`Model ${currentModel} returned non-JSON response`);

            return JSON.parse(jsonMatch[0]);
        } catch (e: any) {
            console.warn(`OpenRouter model "${currentModel}" failed:`, e?.message || e);
            lastError = e;
        }
    }

    throw lastError || new Error("All OpenRouter models failed");
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
