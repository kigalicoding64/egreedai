export interface EgreedModel {
  id: string;
  name: string;
  tagline: string;
  icon: string;
}

export const EGREED_MODELS: EgreedModel[] = [
  { id: "egreed-fast", name: "EgreedAI Fast", tagline: "Quick, balanced answers", icon: "⚡" },
  { id: "egreed-pro", name: "EgreedAI Pro", tagline: "Deep, thorough reasoning", icon: "✨" },
  { id: "egreed-reason", name: "EgreedAI Reason", tagline: "Step-by-step problem solving", icon: "🧠" },
  { id: "egreed-coder", name: "EgreedAI Coder", tagline: "Production-quality code", icon: "💻" },
  { id: "egreed-nano", name: "EgreedAI Nano", tagline: "Ultra-fast short replies", icon: "🪶" },
];

export const DEFAULT_MODEL_ID = "egreed-fast";
