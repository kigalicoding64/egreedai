import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Builder from "./pages/Builder";
import KnowledgeBase from "./pages/KnowledgeBase";
import KinyarwandaEval from "./pages/KinyarwandaEval";
import ModelEval from "./pages/ModelEval";
import NotFound from "./pages/NotFound";
import { Seo } from "./components/Seo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Seo />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/kinyarwanda-eval" element={<KinyarwandaEval />} />
          <Route path="/model-eval" element={<ModelEval />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
