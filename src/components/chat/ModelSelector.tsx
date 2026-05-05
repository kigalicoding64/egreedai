import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EGREED_MODELS, EgreedModel } from "@/types/egreedModels";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ModelSelector({ selectedId, onSelect }: Props) {
  const current = EGREED_MODELS.find((m) => m.id === selectedId) || EGREED_MODELS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 font-medium">
          <span>{current.icon}</span>
          <span className="hidden sm:inline">{current.name}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {EGREED_MODELS.map((m: EgreedModel) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="flex items-start gap-3 py-2.5 cursor-pointer"
          >
            <span className="text-lg leading-none mt-0.5">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2">
                {m.name}
                {m.id === selectedId && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground">{m.tagline}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
