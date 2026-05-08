import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft } from "lucide-react";
import { isKinyarwandaQuery } from "@/utils/kinyarwandaCorpus";
import { KINYARWANDA_TEST_CASES } from "@/utils/kinyarwandaTestCases";

export default function KinyarwandaEval() {
  const [tryText, setTryText] = useState("");
  const results = useMemo(() => KINYARWANDA_TEST_CASES.map((c) => {
    const actual = isKinyarwandaQuery(c.text);
    return { ...c, actual, pass: actual === c.expected };
  }), []);
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const accuracy = Math.round((passed / total) * 100);

  const liveDetected = tryText.trim() ? isKinyarwandaQuery(tryText) : null;

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to chat
      </Link>
      <h1 className="text-3xl font-bold mb-2">Kinyarwanda Detection — Eval</h1>
      <p className="text-muted-foreground mb-6">
        Tests the heuristic that decides when to inject the Kinyarwanda corpus into the system prompt.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accuracy</span>
            <Badge variant={accuracy === 100 ? "default" : accuracy >= 80 ? "secondary" : "destructive"}>
              {passed}/{total} · {accuracy}%
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Try a query</CardTitle></CardHeader>
        <CardContent className="flex gap-2 items-center">
          <Input
            value={tryText}
            onChange={(e) => setTryText(e.target.value)}
            placeholder="Type any text…"
          />
          <Button variant="outline" onClick={() => setTryText("")}>Clear</Button>
          {liveDetected !== null && (
            <Badge variant={liveDetected ? "default" : "outline"}>
              {liveDetected ? "Kinyarwanda" : "Not Kinyarwanda"}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Test cases</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${r.pass ? "border-border" : "border-destructive bg-destructive/5"}`}
            >
              {r.pass
                ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                : <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.text}</div>
                <div className="text-xs text-muted-foreground">{r.note}</div>
              </div>
              <Badge variant="outline">expected: {String(r.expected)}</Badge>
              <Badge variant={r.actual ? "default" : "secondary"}>actual: {String(r.actual)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
