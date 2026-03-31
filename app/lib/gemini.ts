import { AIResponseFormat } from "~/constants";

/**
 * Google reorganized Gemini models across API versions:
 *   - gemini-1.5-* → v1 (stable)
 *   - gemini-2.0-* / gemini-2.5-* → v1beta (preview/experimental)
 *
 * Calling the wrong version returns a 404 "model not found" error.
 * This helper picks the correct version, with the other as a fallback.
 */
function getApiVersionsForModel(model: string): [primary: string, fallback: string] {
    if (model.startsWith("gemini-2.") || model.startsWith("gemini-2.5")) {
        return ["v1beta", "v1"];
    }
    // gemini-1.5-* and anything else defaults to stable v1
    return ["v1", "v1beta"];
}

async function callGeminiAPI(
    apiKey: string,
    model: string,
    apiVersion: string,
    body: object
): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

export async function analyzeWithGemini(
    imageBlob: Blob,
    jobTitle: string,
    jobDescription: string,
    apiKey: string,
    model: string = "gemini-2.0-flash"
) {
    const base64Data = await blobToBase64(imageBlob);
    const base64Content = base64Data.split(",")[1];
    const mimeType = base64Data.split(",")[0].split(":")[1].split(";")[0];

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

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Content,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            responseMimeType: "application/json",
        },
    };

    const [primaryVersion, fallbackVersion] = getApiVersionsForModel(model);
    console.log(`Gemini: trying model "${model}" via API ${primaryVersion}`);

    let response = await callGeminiAPI(apiKey, model, primaryVersion, requestBody);

    // If primary API version returns 404 (model not found), retry with fallback version
    if (response.status === 404) {
        console.warn(`Gemini: model "${model}" not found in ${primaryVersion}, retrying with ${fallbackVersion}`);
        response = await callGeminiAPI(apiKey, model, fallbackVersion, requestBody);
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || "Gemini API request failed");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try {
            return JSON.parse(cleaned);
        } catch (e2) {
            throw new Error("Failed to parse analysis results from AI");
        }
    }
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
