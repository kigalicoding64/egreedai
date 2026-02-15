import { BuilderComponent } from '@/types/builder';
import { cn } from '@/lib/utils';

interface ComponentRendererProps {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isPreview?: boolean;
}

export function ComponentRenderer({ component, isSelected, onSelect, isPreview = false }: ComponentRendererProps) {
  const { type, props, styles, id } = component;

  const wrapperClass = cn(
    'relative group transition-all',
    !isPreview && 'cursor-pointer',
    !isPreview && isSelected && 'ring-2 ring-primary ring-offset-2 rounded',
    !isPreview && !isSelected && 'hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 rounded'
  );

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    onSelect(id);
  };

  const renderContent = () => {
    switch (type) {
      case 'heading': {
        const Tag = (props.level || 'h2') as keyof JSX.IntrinsicElements;
        const sizeClass = {
          h1: 'text-4xl font-bold',
          h2: 'text-3xl font-bold',
          h3: 'text-2xl font-semibold',
          h4: 'text-xl font-semibold',
          h5: 'text-lg font-medium',
          h6: 'text-base font-medium',
        }[props.level || 'h2'];
        return <Tag className={sizeClass} style={styles}>{props.text}</Tag>;
      }
      case 'paragraph':
        return <p className="text-base leading-relaxed" style={styles}>{props.text}</p>;
      case 'button':
        return (
          <a href={props.href || '#'} className={cn(
            'inline-block px-6 py-3 rounded-lg font-semibold text-sm transition-colors',
            props.variant === 'secondary' ? 'bg-secondary text-secondary-foreground' :
            props.variant === 'outline' ? 'border-2 border-primary text-primary' :
            'bg-primary text-primary-foreground'
          )} style={styles} onClick={e => e.preventDefault()}>
            {props.text}
          </a>
        );
      case 'image':
        return <img src={props.src} alt={props.alt || ''} className="max-w-full h-auto rounded-lg" style={styles} />;
      case 'video':
        return props.src ? (
          <video src={props.src} controls className="max-w-full rounded-lg" style={styles} />
        ) : (
          <div className="bg-muted rounded-lg flex items-center justify-center h-48 text-muted-foreground" style={styles}>
            📹 Video placeholder
          </div>
        );
      case 'divider':
        return <hr className="border-border my-4" style={styles} />;
      case 'spacer':
        return <div style={{ height: props.height || '40px', ...styles }} />;
      case 'container':
        return (
          <div className="mx-auto" style={{ maxWidth: props.maxWidth || '1200px', ...styles }}>
            {component.children?.map(child => (
              <ComponentRenderer key={child.id} component={child} isSelected={false} onSelect={onSelect} isPreview={isPreview} />
            ))}
            {!component.children?.length && !isPreview && (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                Drop components here
              </div>
            )}
          </div>
        );
      case 'grid':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${props.columns || 3}, 1fr)`, gap: props.gap || '20px', ...styles }}>
            {component.children?.map(child => (
              <ComponentRenderer key={child.id} component={child} isSelected={false} onSelect={onSelect} isPreview={isPreview} />
            ))}
            {!component.children?.length && !isPreview && (
              <div className="col-span-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                Drop components here
              </div>
            )}
          </div>
        );
      case 'navbar':
        return (
          <nav className="border-b border-border" style={styles}>
            <div className="flex items-center justify-between max-w-[1200px] mx-auto px-4 py-4">
              <span className="text-xl font-bold">{props.brand}</span>
              <div className="flex gap-6">
                {(props.links || []).map((link: string, i: number) => (
                  <a key={i} href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm" onClick={e => e.preventDefault()}>
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        );
      case 'hero':
        return (
          <section
            className="text-center py-20 px-6"
            style={{
              ...(props.bgImage ? { backgroundImage: `url(${props.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))' }),
              ...styles,
            }}
          >
            <h1 className="text-5xl font-bold mb-4">{props.title}</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{props.subtitle}</p>
            <a href="#" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold" onClick={e => e.preventDefault()}>
              {props.ctaText}
            </a>
          </section>
        );
      case 'footer':
        return (
          <footer className="border-t border-border text-center py-10 px-6" style={styles}>
            <div className="flex justify-center gap-6 mb-4">
              {(props.links || []).map((link: string, i: number) => (
                <a key={i} href="#" className="text-muted-foreground hover:text-foreground text-sm" onClick={e => e.preventDefault()}>
                  {link}
                </a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{props.copyright}</p>
          </footer>
        );
      case 'card':
        return (
          <div className="border border-border rounded-xl p-6 bg-card" style={styles}>
            <h3 className="text-lg font-semibold mb-2">{props.title}</h3>
            <p className="text-muted-foreground text-sm">{props.description}</p>
          </div>
        );
      case 'testimonial':
        return (
          <blockquote className="text-center py-10 px-6" style={styles}>
            <p className="text-xl italic mb-4">"{props.quote}"</p>
            <p className="font-semibold">{props.author}</p>
            <p className="text-sm text-muted-foreground">{props.role}</p>
          </blockquote>
        );
      case 'pricing':
        return (
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${(props.plans || []).length}, 1fr)`, ...styles }}>
            {(props.plans || []).map((plan: any, i: number) => (
              <div key={i} className="border border-border rounded-xl p-8 text-center bg-card">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-4xl font-bold my-4">{plan.price}</p>
                <p className="text-sm text-muted-foreground mb-4">/month</p>
                <ul className="space-y-2 mb-6">
                  {(plan.features || []).map((f: string, j: number) => (
                    <li key={j} className="text-sm">✓ {f}</li>
                  ))}
                </ul>
                <a href="#" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium" onClick={e => e.preventDefault()}>
                  Choose Plan
                </a>
              </div>
            ))}
          </div>
        );
      case 'faq':
        return (
          <div className="max-w-2xl mx-auto" style={styles}>
            {(props.items || []).map((item: any, i: number) => (
              <details key={i} className="border-b border-border py-4">
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                <p className="mt-2 text-muted-foreground text-sm">{item.answer}</p>
              </details>
            ))}
          </div>
        );
      case 'cta':
        return (
          <section className="text-center py-16 px-6" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.15))', ...styles }}>
            <h2 className="text-3xl font-bold mb-3">{props.title}</h2>
            <p className="text-muted-foreground mb-6">{props.subtitle}</p>
            <a href={props.buttonHref || '#'} className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold" onClick={e => e.preventDefault()}>
              {props.buttonText}
            </a>
          </section>
        );
      case 'list':
        const ListTag = props.ordered ? 'ol' : 'ul';
        return (
          <ListTag className={cn('pl-6 space-y-1', props.ordered ? 'list-decimal' : 'list-disc')} style={styles}>
            {(props.items || []).map((item: string, i: number) => (
              <li key={i} className="text-sm">{item}</li>
            ))}
          </ListTag>
        );
      case 'input':
        return (
          <div style={styles}>
            <label className="block text-sm font-medium mb-1">{props.label}</label>
            <input type={props.type || 'text'} placeholder={props.placeholder} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" readOnly />
          </div>
        );
      case 'form':
        return (
          <form className="space-y-4 p-6 border border-border rounded-xl" style={styles} onSubmit={e => e.preventDefault()}>
            {component.children?.map(child => (
              <ComponentRenderer key={child.id} component={child} isSelected={false} onSelect={onSelect} isPreview={isPreview} />
            ))}
            {!component.children?.length && !isPreview && (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground text-sm">
                Drop form elements here
              </div>
            )}
          </form>
        );
      default:
        return <div style={styles}>Unknown: {type}</div>;
    }
  };

  return (
    <div className={wrapperClass} onClick={handleClick}>
      {renderContent()}
      {!isPreview && isSelected && (
        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-t font-medium z-10">
          {type}
        </div>
      )}
    </div>
  );
}
