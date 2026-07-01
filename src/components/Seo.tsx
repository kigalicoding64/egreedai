import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
  keywords: string;
  schema?: Record<string, unknown>;
};

const SITE_URL = "https://ai.egreedtech.org";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

const baseKeywords = [
  "EgreedAI",
  "Egreed Technology",
  "AI Rwanda",
  "Kinyarwanda AI",
  "African AI assistant",
  "Kigali AI",
  "chatbot Rwanda",
  "AI Afrika",
];

const pageSeo: Record<string, SeoConfig> = {
  "/": {
    title: "EgreedAI — Africa-first AI Assistant for Rwanda and Africa",
    description:
      "Chat with EgreedAI, an Africa-first AI assistant from Kigali that supports English, French and Kinyarwanda with practical local context.",
    canonicalPath: "/",
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    keywords: [...baseKeywords, "AI chat Rwanda", "multilingual AI assistant"].join(", "),
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "EgreedAI",
      url: `${SITE_URL}/`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: ["en", "fr", "rw"],
      description:
        "Africa-first AI assistant that speaks English, French and Kinyarwanda, built in Rwanda by Egreed Technology.",
      publisher: { "@type": "Organization", name: "Egreed Technology LTD" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  },
  "/builder": {
    title: "EgreedAI Builder — AI Website and App Builder",
    description:
      "Build, preview and export web pages with the EgreedAI no-code and AI-assisted builder for teams, students and businesses.",
    canonicalPath: "/builder",
    robots: "index, follow, max-image-preview:large",
    keywords: [...baseKeywords, "AI website builder", "no-code builder Rwanda"].join(", "),
  },
  "/knowledge": {
    title: "EgreedAI Knowledge Base — Ground AI Answers in Your Data",
    description:
      "Add documents, notes and trusted URLs to EgreedAI so responses are grounded in your own private knowledge base.",
    canonicalPath: "/knowledge",
    robots: "noindex, nofollow",
    keywords: [...baseKeywords, "AI knowledge base", "document AI assistant"].join(", "),
  },
  "/kinyarwanda-eval": {
    title: "Kinyarwanda AI Evaluation — EgreedAI",
    description:
      "Evaluate EgreedAI responses for Kinyarwanda language quality, cultural context and practical usefulness.",
    canonicalPath: "/kinyarwanda-eval",
    robots: "index, follow, max-image-preview:large",
    keywords: [...baseKeywords, "Kinyarwanda evaluation", "Rwanda language AI"].join(", "),
  },
  "/model-eval": {
    title: "AI Model Evaluation — EgreedAI",
    description:
      "Compare EgreedAI model responses for quality, accuracy and usefulness across multilingual African AI use cases.",
    canonicalPath: "/model-eval",
    robots: "index, follow, max-image-preview:large",
    keywords: [...baseKeywords, "AI model evaluation", "LLM evaluation"].join(", "),
  },
  "/auth": {
    title: "Sign in to EgreedAI",
    description: "Sign in or create an account to save chats, preferences and EgreedAI knowledge base documents.",
    canonicalPath: "/auth",
    robots: "noindex, nofollow",
    keywords: baseKeywords.join(", "),
  },
  "/settings": {
    title: "EgreedAI Settings",
    description: "Manage EgreedAI language, voice and conversation preferences.",
    canonicalPath: "/settings",
    robots: "noindex, nofollow",
    keywords: baseKeywords.join(", "),
  },
};

const setMeta = (selector: string, attr: "content" | "href", value: string) => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attr, value);
};

const upsertMeta = (name: string, content: string, property = false) => {
  const attr = property ? "property" : "name";
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertSchema = (schema?: Record<string, unknown>) => {
  document.querySelector("script[data-seo-schema]")?.remove();
  if (!schema) return;

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.seoSchema = "true";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
};

export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const config = pageSeo[location.pathname] ?? {
      title: "EgreedAI — Page Not Found",
      description: "The EgreedAI page you requested could not be found.",
      canonicalPath: location.pathname,
      robots: "noindex, nofollow",
      keywords: baseKeywords.join(", "),
    };

    const canonicalUrl = `${SITE_URL}${config.canonicalPath}`;
    document.title = config.title;

    upsertMeta("description", config.description);
    upsertMeta("keywords", config.keywords);
    upsertMeta("robots", config.robots);
    upsertMeta("og:title", config.title, true);
    upsertMeta("og:description", config.description, true);
    upsertMeta("og:url", canonicalUrl, true);
    upsertMeta("og:image", DEFAULT_IMAGE, true);
    upsertMeta("twitter:title", config.title);
    upsertMeta("twitter:description", config.description);
    upsertMeta("twitter:image", DEFAULT_IMAGE);
    setMeta('link[rel="canonical"]', "href", canonicalUrl);
    upsertSchema(config.schema);
  }, [location.pathname]);

  return null;
}
