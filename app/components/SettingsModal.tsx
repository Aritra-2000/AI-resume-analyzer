import { useState, useEffect } from "react";
import { usePuterStore } from "~/lib/puter";
import { FREE_VISION_MODELS } from "~/lib/openrouter";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { kv } = usePuterStore();

  // Gemini settings
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash");

  // OpenRouter settings
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState(FREE_VISION_MODELS[0].id);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        const savedGeminiKey = await kv.get("gemini_api_key");
        const savedGeminiModel = await kv.get("gemini_model");
        const savedORKey = await kv.get("openrouter_api_key");
        const savedORModel = await kv.get("openrouter_model");

        if (savedGeminiKey) setGeminiKey(savedGeminiKey);
        if (savedGeminiModel) setGeminiModel(savedGeminiModel);
        if (savedORKey) setOpenRouterKey(savedORKey);
        if (savedORModel) setOpenRouterModel(savedORModel);
      };
      loadSettings();
      setMessage("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save Gemini settings
      if (geminiKey.trim()) {
        await kv.set("gemini_api_key", geminiKey.trim());
      } else {
        await kv.delete("gemini_api_key");
      }
      await kv.set("gemini_model", geminiModel);

      // Save OpenRouter settings
      if (openRouterKey.trim()) {
        await kv.set("openrouter_api_key", openRouterKey.trim());
      } else {
        await kv.delete("openrouter_api_key");
      }
      await kv.set("openrouter_model", openRouterModel);

      setMessage("Settings saved successfully!");
      setTimeout(onClose, 1500);
    } catch (err) {
      setMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <img src="/icons/cross.svg" className="w-6 h-6" alt="close" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-gradient">AI Settings</h2>
        <p className="text-xs text-gray-500 mb-6">
          Priority order: <strong>Gemini</strong> → <strong>OpenRouter</strong> → <strong>Puter AI (free)</strong>
        </p>

        <div className="flex flex-col gap-7">

          {/* ── Puter AI (always free) ── */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">Always FREE</span>
              <span className="font-semibold text-sm text-green-900">Puter AI (GPT-4o)</span>
            </div>
            <p className="text-[11px] text-green-700">
              No key needed — sign in with your free Puter account. Uses GPT-4o with vision.
              Works as the final fallback when no API keys are set. Good for <strong>3–10 resumes/day</strong>.
            </p>
          </div>

          {/* ── OpenRouter (free tier) ── */}
          <div className="form-div">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">FREE tier</span>
              <label className="font-semibold text-sm">OpenRouter API Key</label>
            </div>
            <input
              type="password"
              placeholder="Paste OpenRouter key (sk-or-...)"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Get a <strong>free</strong> key at{" "}
              <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-500 underline">
                openrouter.ai/keys
              </a>{" "}
              — no billing required. Free models have generous daily limits.
            </p>

            <label className="font-semibold text-sm mt-3 block">Free Vision Model</label>
            <select
              value={openRouterModel}
              onChange={(e) => setOpenRouterModel(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              {FREE_VISION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
              <option disabled>──────────────────</option>
              <option value="openai/gpt-4o">GPT-4o (paid)</option>
              <option value="openai/gpt-4o-mini">GPT-4o Mini (cheap, paid)</option>
              <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet (paid)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Models marked <em>(Free)</em> cost $0 — auto-fallback to next free model if rate-limited.
            </p>
          </div>

          {/* ── Gemini (paid key) ── */}
          <div className="form-div">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Highest Priority</span>
              <label className="font-semibold text-sm">Google Gemini API Key</label>
            </div>
            <input
              type="password"
              placeholder="Paste Gemini API key from Google AI Studio"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Get your key at{" "}
              <a href="https://aistudio.google.com/" target="_blank" className="text-blue-500 underline">
                aistudio.google.com
              </a>
              . Free tier: 500 req/day on Gemini 2.0 Flash.
            </p>

            <label className="font-semibold text-sm mt-3 block">Gemini Model</label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended, 500 req/day free)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (1500 req/day free)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (50 req/day free)</option>
              <option value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro (Most Powerful)</option>
            </select>
          </div>

          {message && (
            <p className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-500"} text-center font-medium`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="primary-button text-lg font-semibold py-3 mt-2"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
