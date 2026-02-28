/// <reference types="vite/client" />

interface PuterAI {
  chat(
    prompt: string | Array<{ role: string; content: string }>,
    options?: { model?: string; stream?: boolean }
  ): Promise<any>;
  txt2img(prompt: string, testMode?: boolean): Promise<HTMLImageElement>;
}

interface Puter {
  ai: PuterAI;
  print: (text: string) => void;
}

declare var puter: Puter;
