import { BuilderComponent } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';

interface PropertiesPanelProps {
  component: BuilderComponent | null;
  onUpdateProps: (id: string, props: Record<string, any>) => void;
  onUpdateStyles: (id: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

export function PropertiesPanel({ component, onUpdateProps, onUpdateStyles, onClose }: PropertiesPanelProps) {
  if (!component) {
    return (
      <div className="w-72 border-l border-border bg-card p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">Select a component to edit its properties</p>
      </div>
    );
  }

  const { id, type, props, styles = {} } = component;

  const renderPropEditor = () => {
    switch (type) {
      case 'heading':
        return (
          <>
            <Field label="Text">
              <Input value={props.text || ''} onChange={e => onUpdateProps(id, { text: e.target.value })} />
            </Field>
            <Field label="Level">
              <Select value={props.level || 'h2'} onValueChange={v => onUpdateProps(id, { level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(h => (
                    <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        );
      case 'paragraph':
        return (
          <Field label="Text">
            <Textarea value={props.text || ''} onChange={e => onUpdateProps(id, { text: e.target.value })} rows={4} />
          </Field>
        );
      case 'button':
        return (
          <>
            <Field label="Text">
              <Input value={props.text || ''} onChange={e => onUpdateProps(id, { text: e.target.value })} />
            </Field>
            <Field label="Link">
              <Input value={props.href || ''} onChange={e => onUpdateProps(id, { href: e.target.value })} />
            </Field>
            <Field label="Variant">
              <Select value={props.variant || 'primary'} onValueChange={v => onUpdateProps(id, { variant: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </>
        );
      case 'image':
        return (
          <>
            <Field label="Image URL">
              <Input value={props.src || ''} onChange={e => onUpdateProps(id, { src: e.target.value })} />
            </Field>
            <Field label="Alt Text">
              <Input value={props.alt || ''} onChange={e => onUpdateProps(id, { alt: e.target.value })} />
            </Field>
          </>
        );
      case 'spacer':
        return (
          <Field label="Height">
            <Input value={props.height || '40px'} onChange={e => onUpdateProps(id, { height: e.target.value })} />
          </Field>
        );
      case 'navbar':
        return (
          <>
            <Field label="Brand Name">
              <Input value={props.brand || ''} onChange={e => onUpdateProps(id, { brand: e.target.value })} />
            </Field>
            <Field label="Links">
              <ListEditor items={props.links || []} onChange={links => onUpdateProps(id, { links })} />
            </Field>
          </>
        );
      case 'hero':
        return (
          <>
            <Field label="Title">
              <Input value={props.title || ''} onChange={e => onUpdateProps(id, { title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Textarea value={props.subtitle || ''} onChange={e => onUpdateProps(id, { subtitle: e.target.value })} rows={2} />
            </Field>
            <Field label="CTA Text">
              <Input value={props.ctaText || ''} onChange={e => onUpdateProps(id, { ctaText: e.target.value })} />
            </Field>
            <Field label="Background Image URL">
              <Input value={props.bgImage || ''} onChange={e => onUpdateProps(id, { bgImage: e.target.value })} placeholder="Optional" />
            </Field>
          </>
        );
      case 'footer':
        return (
          <>
            <Field label="Copyright">
              <Input value={props.copyright || ''} onChange={e => onUpdateProps(id, { copyright: e.target.value })} />
            </Field>
            <Field label="Links">
              <ListEditor items={props.links || []} onChange={links => onUpdateProps(id, { links })} />
            </Field>
          </>
        );
      case 'card':
        return (
          <>
            <Field label="Title">
              <Input value={props.title || ''} onChange={e => onUpdateProps(id, { title: e.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={props.description || ''} onChange={e => onUpdateProps(id, { description: e.target.value })} rows={3} />
            </Field>
          </>
        );
      case 'testimonial':
        return (
          <>
            <Field label="Quote">
              <Textarea value={props.quote || ''} onChange={e => onUpdateProps(id, { quote: e.target.value })} rows={3} />
            </Field>
            <Field label="Author">
              <Input value={props.author || ''} onChange={e => onUpdateProps(id, { author: e.target.value })} />
            </Field>
            <Field label="Role">
              <Input value={props.role || ''} onChange={e => onUpdateProps(id, { role: e.target.value })} />
            </Field>
          </>
        );
      case 'cta':
        return (
          <>
            <Field label="Title">
              <Input value={props.title || ''} onChange={e => onUpdateProps(id, { title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Input value={props.subtitle || ''} onChange={e => onUpdateProps(id, { subtitle: e.target.value })} />
            </Field>
            <Field label="Button Text">
              <Input value={props.buttonText || ''} onChange={e => onUpdateProps(id, { buttonText: e.target.value })} />
            </Field>
          </>
        );
      case 'grid':
        return (
          <>
            <Field label="Columns">
              <Input type="number" min={1} max={6} value={props.columns || 3} onChange={e => onUpdateProps(id, { columns: parseInt(e.target.value) || 3 })} />
            </Field>
            <Field label="Gap">
              <Input value={props.gap || '20px'} onChange={e => onUpdateProps(id, { gap: e.target.value })} />
            </Field>
          </>
        );
      case 'container':
        return (
          <Field label="Max Width">
            <Input value={props.maxWidth || '1200px'} onChange={e => onUpdateProps(id, { maxWidth: e.target.value })} />
          </Field>
        );
      case 'input':
        return (
          <>
            <Field label="Label">
              <Input value={props.label || ''} onChange={e => onUpdateProps(id, { label: e.target.value })} />
            </Field>
            <Field label="Placeholder">
              <Input value={props.placeholder || ''} onChange={e => onUpdateProps(id, { placeholder: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={props.type || 'text'} onValueChange={v => onUpdateProps(id, { type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['text', 'email', 'password', 'number', 'tel', 'url'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        );
      case 'list':
        return (
          <Field label="Items">
            <ListEditor items={props.items || []} onChange={items => onUpdateProps(id, { items })} />
          </Field>
        );
      default:
        return <p className="text-sm text-muted-foreground">No editable properties</p>;
    }
  };

  return (
    <div className="w-72 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm capitalize">{type} Properties</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        {renderPropEditor()}
        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Styles</h4>
          <Field label="Padding">
            <Input value={styles.padding || ''} onChange={e => onUpdateStyles(id, { padding: e.target.value })} placeholder="e.g. 20px" />
          </Field>
          <Field label="Margin">
            <Input value={styles.margin || ''} onChange={e => onUpdateStyles(id, { margin: e.target.value })} placeholder="e.g. 10px 0" />
          </Field>
          <Field label="Background">
            <Input value={styles.background || ''} onChange={e => onUpdateStyles(id, { background: e.target.value })} placeholder="e.g. #f0f0f0" />
          </Field>
          <Field label="Color">
            <Input value={styles.color || ''} onChange={e => onUpdateStyles(id, { color: e.target.value })} placeholder="e.g. #333" />
          </Field>
          <Field label="Border Radius">
            <Input value={styles.borderRadius || ''} onChange={e => onUpdateStyles(id, { borderRadius: e.target.value })} placeholder="e.g. 8px" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ListEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1">
          <Input
            value={item}
            onChange={e => {
              const newItems = [...items];
              newItems[i] = e.target.value;
              onChange(newItems);
            }}
            className="h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => onChange([...items, 'New Item'])}>
        <Plus className="w-3 h-3 mr-1" /> Add Item
      </Button>
    </div>
  );
}
