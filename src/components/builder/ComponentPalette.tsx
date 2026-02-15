import { useState } from 'react';
import { COMPONENT_DEFINITIONS, ComponentType } from '@/types/builder';
import { cn } from '@/lib/utils';
import {
  Type, AlignLeft, Square, Image, Video, Minus, MoveVertical, List,
  TextCursorInput, Layout, Grid3X3, CreditCard, FileInput, Menu,
  Sparkles, PanelBottom, Quote, DollarSign, HelpCircle, Megaphone,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Type, AlignLeft, Square, Image, Video, Minus, MoveVertical, List,
  TextCursorInput, Layout, Grid3x3: Grid3X3, CreditCard, FileInput, Menu,
  Sparkles, PanelBottom, Quote, DollarSign, HelpCircle, Megaphone,
};

const categories = [
  { key: 'basic', label: 'Basic' },
  { key: 'layout', label: 'Layout' },
  { key: 'media', label: 'Media' },
  { key: 'sections', label: 'Sections' },
];

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const [activeCategory, setActiveCategory] = useState('basic');

  const filteredComponents = COMPONENT_DEFINITIONS.filter(d => d.category === activeCategory);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              activeCategory === cat.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredComponents.map(def => {
          const Icon = iconMap[def.icon] || Square;
          return (
            <button
              key={def.type}
              onClick={() => onAddComponent(def.type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/40 transition-all text-xs group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('componentType', def.type);
              }}
            >
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium">{def.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
