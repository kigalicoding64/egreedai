import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Play, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { EVAL_CASES, type EvalCase, type EvalCategory } from '@/utils/modelEvalCases';
import { scoreOutput, type EvalResult } from '@/utils/modelEvalScoring';
import { EGREED_MODELS } from '@/types/egreedModels';
import { BASE_SYSTEM, KINYARWANDA_CORPUS, isKinyarwandaQuery } from '@/utils/kinyarwandaCorpus';

const PUTER_MODEL_MAP: Record<string, { model: string; persona: string }> = {
  'egreed-fast':   { model: 'gpt-5-nano',  persona: 'Be quick, friendly, concise.' },
  'egreed-pro':    { model: 'gpt-5',       persona: 'Be deeply thoughtful, thorough, accurate. Use markdown structure.' },
  'egreed-reason': { model: 'gpt-5',       persona: 'Think step by step. Show clear reasoning then a definitive answer.' },
  'egreed-coder':  { model: 'gpt-5-mini',  persona: 'You are an expert software engineer. Always produce production-quality code with file paths.' },
  'egreed-nano':   { model: 'gpt-5-nano',  persona: 'Ultra-fast assistant. Answer in 1-3 sentences unless asked for detail.' },
};

async function runCase(c: EvalCase, modelId: string): Promise<EvalResult> {
  const variant = PUTER_MODEL_MAP[modelId] || PUTER_MODEL_MAP['egreed-fast'];
  const rwContext = isKinyarwandaQuery(c.prompt) ? `\n\n${KINYARWANDA_CORPUS}` : '';
  const system = `${BASE_SYSTEM}\n\n${variant.persona}${rwContext}`;
  const start = performance.now();
  try {
    if (typeof (window as any).puter === 'undefined') throw new Error('Puter.js not loaded');
    const res: any = await (window as any).puter.ai.chat(
      [
        { role: 'system', content: system },
        { role: 'user', content: c.prompt },
      ],
      { model: variant.model, stream: false }
    );
    const text =
      res?.message?.content?.[0]?.text ??
      res?.message?.content ??
      res?.text ??
      (typeof res === 'string' ? res : JSON.stringify(res));
    const latency = Math.round(performance.now() - start);
    return scoreOutput(c, String(text || ''), latency);
  } catch (e) {
    const latency = Math.round(performance.now() - start);
    return scoreOutput(c, '', latency, (e as Error).message);
  }
}

const CATEGORY_LABELS: Record<EvalCategory, string> = {
  kinyarwanda: 'Kinyarwanda',
  professional: 'Professional',
  reasoning: 'Reasoning',
  code: 'Code',
  'egreed-facts': 'Egreed facts',
};

export default function ModelEval() {
  const [modelId, setModelId] = useState('egreed-pro');
  const [category, setCategory] = useState<'all' | EvalCategory>('all');
  const [results, setResults] = useState<Record<string, EvalResult>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  const filtered = useMemo(
    () => (category === 'all' ? EVAL_CASES : EVAL_CASES.filter((c) => c.category === category)),
    [category]
  );

  const stats = useMemo(() => {
    const rs = filtered.map((c) => results[c.id]).filter(Boolean) as EvalResult[];
    if (rs.length === 0) return { ran: 0, passed: 0, avgScore: 0, avgMs: 0 };
    return {
      ran: rs.length,
      passed: rs.filter((r) => r.passed).length,
      avgScore: Math.round(rs.reduce((s, r) => s + r.score, 0) / rs.length),
      avgMs: Math.round(rs.reduce((s, r) => s + r.latencyMs, 0) / rs.length),
    };
  }, [results, filtered]);

  const runOne = async (c: EvalCase) => {
    setRunningId(c.id);
    const r = await runCase(c, modelId);
    setResults((prev) => ({ ...prev, [c.id]: r }));
    setRunningId(null);
  };

  const runAll = async () => {
    setBatchRunning(true);
    setResults({});
    for (const c of filtered) {
      setRunningId(c.id);
      const r = await runCase(c, modelId);
      setResults((prev) => ({ ...prev, [c.id]: r }));
    }
    setRunningId(null);
    setBatchRunning(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">EgreedAI Model Evaluation</h1>
            <p className="text-sm text-muted-foreground">
              Run a Kinyarwanda + professional-answer test suite against your fine-tuned EgreedAI model.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">EgreedAI variant</label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EGREED_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as EvalCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runAll} disabled={batchRunning} className="gap-2">
              {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {batchRunning ? 'Running…' : `Run all (${filtered.length})`}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Cases run" value={`${stats.ran}/${filtered.length}`} />
          <StatCard label="Passed" value={`${stats.passed}/${stats.ran}`} tone={stats.ran && stats.passed === stats.ran ? 'good' : 'neutral'} />
          <StatCard label="Avg score" value={`${stats.avgScore}%`} tone={stats.avgScore >= 75 ? 'good' : stats.avgScore >= 50 ? 'neutral' : 'bad'} />
          <StatCard label="Avg latency" value={`${stats.avgMs} ms`} />
        </div>

        {stats.ran > 0 && <Progress value={(stats.passed / Math.max(stats.ran, 1)) * 100} />}

        <div className="space-y-3">
          {filtered.map((c) => {
            const r = results[c.id];
            const isRunning = runningId === c.id;
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline">{CATEGORY_LABELS[c.category]}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{c.id}</span>
                        {r && (
                          <Badge variant={r.passed ? 'default' : 'destructive'} className="gap-1">
                            {r.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {r.score}%
                          </Badge>
                        )}
                        {r && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{r.latencyMs} ms</span>}
                      </div>
                      <p className="text-sm font-medium">{c.prompt}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => runOne(c)} disabled={isRunning || batchRunning} className="gap-2">
                      {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Run
                    </Button>
                  </div>

                  {r && (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {r.checks.map((ch, i) => (
                          <Badge key={i} variant={ch.pass ? 'secondary' : 'destructive'} className="text-[10px] font-normal">
                            {ch.pass ? '✓' : '✗'} {ch.label}
                          </Badge>
                        ))}
                      </div>
                      {r.error ? (
                        <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{r.error}</div>
                      ) : (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View response ({r.output.length} chars)
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap bg-muted/50 rounded p-3 max-h-64 overflow-auto">{r.output}</pre>
                        </details>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const toneCls =
    tone === 'good' ? 'text-green-500' : tone === 'bad' ? 'text-destructive' : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
