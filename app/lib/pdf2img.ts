export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

// Use the worker file from the installed pdfjs-dist to keep versions in sync
// Vite will transform this to a URL string at build time
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Set the worker source to the exact version bundled by the app
        try {
            lib.GlobalWorkerOptions.workerSrc = workerUrl as string;
        } catch {
            lib.GlobalWorkerOptions.workerSrc = workerUrl as string;
        }
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        // Guard: ensure we are in a browser
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return { imageUrl: "", file: null, error: "PDF conversion requires a browser environment" };
        }

        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        // Use safe scale and cap pixels to avoid memory/toBlob failures
        let scale = 2;
        let viewport = page.getViewport({ scale });
        const MAX_PIXELS = 4_000_000; // ~4MP
        const pixels = () => Math.ceil(viewport.width) * Math.ceil(viewport.height);
        if (pixels() > MAX_PIXELS) {
            const factor = Math.sqrt(MAX_PIXELS / pixels());
            scale = Math.max(0.5, scale * factor);
            viewport = page.getViewport({ scale });
        }
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Ensure integer canvas dimensions
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        if (!context) {
            return { imageUrl: "", file: null, error: "Failed to acquire 2D canvas context" };
        }

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        // Fallback: some browsers can return null from toBlob
                        try {
                            const dataUrl = canvas.toDataURL("image/png");
                            const byteString = atob(dataUrl.split(",")[1]);
                            const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                            const fallbackBlob = new Blob([ab], { type: mimeString });
                            const originalName = file.name.replace(/\.pdf$/i, "");
                            const imageFile = new File([fallbackBlob], `${originalName}.png`, { type: mimeString });
                            resolve({ imageUrl: URL.createObjectURL(fallbackBlob), file: imageFile });
                        } catch {
                            resolve({ imageUrl: "", file: null, error: "Failed to create image blob (and fallback)" });
                        }
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}
