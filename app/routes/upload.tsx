import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import { prepareInstructions } from '~/constants';
import { generateUUID } from '~/lib/utils';
import { convertPdfToImage } from '~/lib/pdf2img';
import { analyzeResumeWithOpenRouter } from '~/lib/openrouter';
import { analyzeWithGemini } from '~/lib/gemini';

const Upload = () => {

    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setStatusText('Converting to image...');
        let imageFile;
        try {
            imageFile = await convertPdfToImage(file);
        } catch (e: any) {
            return setStatusText(`Error: Failed to convert PDF to image (${e?.message || e})`);
        }
        if(!imageFile.file) return setStatusText(`Error: Failed to convert PDF to image${imageFile.error ? ` (${imageFile.error})` : ''}`);

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }

        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        let finalFeedback;
        const geminiKey = await kv.get('gemini_api_key');
        const openRouterKey = await kv.get('openrouter_api_key');
        const openRouterModel = (await kv.get('openrouter_model')) || 'meta-llama/llama-3.2-90b-vision-instruct:free';

        // Sanitize stale/deprecated Gemini model names
        const DEPRECATED_MODELS: Record<string, string> = {
            'gemini-2.0-flash-exp': 'gemini-2.0-flash',
            'gemini-1.0-pro-vision': 'gemini-1.5-flash',
        };
        const rawGeminiModel = (await kv.get('gemini_model')) || 'gemini-2.0-flash';
        const geminiModel = DEPRECATED_MODELS[rawGeminiModel] ?? rawGeminiModel;
        if (rawGeminiModel !== geminiModel) {
            console.warn(`Deprecated model "${rawGeminiModel}" auto-migrated to "${geminiModel}"`);
            await kv.set('gemini_model', geminiModel);
        }

        console.log('AI Provider Status:', {
            hasGemini: !!geminiKey, geminiModel,
            hasOpenRouter: !!openRouterKey, openRouterModel,
            fallback: 'Puter AI (GPT-4o)',
        });

        // ── Provider 1: Google Gemini ──────────────────────────────────────
        if (geminiKey && !finalFeedback) {
            setStatusText(`Analyzing with Google Gemini (${geminiModel})...`);
            try {
                finalFeedback = await analyzeWithGemini(
                    imageFile.file, jobTitle, jobDescription, geminiKey, geminiModel
                );
            } catch (e: any) {
                const isQuota = e?.message?.toLowerCase().includes('quota') || e?.message?.includes('429');
                console.error('Gemini analysis failed:', e);
                if (!openRouterKey) {
                    // No fallback provider — surface the error
                    return setStatusText(`Error: Gemini failed${isQuota ? ' (quota exceeded — add an OpenRouter key in Settings for a free fallback)' : `: ${e.message}`}`);
                }
                console.warn('Gemini failed, falling back to OpenRouter...');
                setStatusText('Gemini unavailable, trying OpenRouter...');
            }
        }

        // ── Provider 2: OpenRouter (free vision models) ────────────────────
        if (openRouterKey && !finalFeedback) {
            setStatusText(`Analyzing with OpenRouter (${openRouterModel.split('/').pop()})...`);
            try {
                finalFeedback = await analyzeResumeWithOpenRouter(
                    imageFile.file, jobTitle, jobDescription, openRouterKey, openRouterModel
                );
            } catch (e: any) {
                console.error('OpenRouter analysis failed:', e);
                console.warn('OpenRouter failed, falling back to Puter AI...');
                setStatusText('OpenRouter unavailable, trying Puter AI...');
            }
        }

        // ── Provider 3: Puter AI (always free, GPT-4o) ────────────────────
        if (!finalFeedback) {
            setStatusText('Analyzing with Puter AI (free)...');
            try {
                const feedback = await ai.feedback(
                    imageFile.file,   // pass File object — puter.ts converts to base64 for all models
                    prepareInstructions({ jobTitle, jobDescription })
                );
                if (!feedback) return setStatusText('Error: Failed to analyze resume');

                let feedbackText: string;
                if (typeof feedback === 'string') {
                    feedbackText = feedback;
                } else {
                    feedbackText = typeof feedback?.message?.content === 'string'
                        ? feedback.message.content
                        : feedback?.message?.content?.[0]?.text;
                }
                if (!feedbackText) return setStatusText('Error: Invalid response from Puter AI');

                const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
                const cleanJson = jsonMatch ? jsonMatch[0] : feedbackText;
                try {
                    finalFeedback = JSON.parse(cleanJson);
                } catch (e) {
                    console.error('Failed to parse Puter AI feedback:', cleanJson);
                    return setStatusText('Error: Failed to parse analysis results');
                }
            } catch (e: any) {
                console.error('Puter AI analysis failed:', e);
                return setStatusText(`Error: All AI providers failed (${e?.message || e})`);
            }
        }

        data.feedback = finalFeedback;

        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        navigate(`/resume/${uuid}`);

    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
