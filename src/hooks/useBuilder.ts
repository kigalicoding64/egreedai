import { useState, useCallback } from 'react';
import { BuilderComponent, BuilderPage, ComponentType, COMPONENT_DEFINITIONS } from '@/types/builder';

const generateId = () => Math.random().toString(36).substring(2, 11);

export function useBuilder() {
  const [pages, setPages] = useState<BuilderPage[]>([
    { id: generateId(), name: 'Home', components: [], createdAt: new Date(), updatedAt: new Date() }
  ]);
  const [activePageId, setActivePageId] = useState(pages[0].id);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [history, setHistory] = useState<BuilderComponent[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const activePage = pages.find(p => p.id === activePageId);
  const components = activePage?.components || [];

  const pushHistory = useCallback((newComponents: BuilderComponent[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newComponents];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateComponents = useCallback((newComponents: BuilderComponent[]) => {
    setPages(prev => prev.map(p =>
      p.id === activePageId
        ? { ...p, components: newComponents, updatedAt: new Date() }
        : p
    ));
    pushHistory(newComponents);
  }, [activePageId, pushHistory]);

  const addComponent = useCallback((type: ComponentType, index?: number) => {
    const def = COMPONENT_DEFINITIONS.find(d => d.type === type);
    if (!def) return;

    const newComponent: BuilderComponent = {
      id: generateId(),
      type,
      props: { ...def.defaultProps },
      styles: def.defaultStyles ? { ...def.defaultStyles } : {},
      children: type === 'container' || type === 'grid' || type === 'form' ? [] : undefined,
    };

    const newComponents = [...components];
    if (index !== undefined) {
      newComponents.splice(index, 0, newComponent);
    } else {
      newComponents.push(newComponent);
    }
    updateComponents(newComponents);
    setSelectedComponentId(newComponent.id);
    return newComponent.id;
  }, [components, updateComponents]);

  const removeComponent = useCallback((id: string) => {
    const removeRecursive = (comps: BuilderComponent[]): BuilderComponent[] =>
      comps.filter(c => c.id !== id).map(c => ({
        ...c,
        children: c.children ? removeRecursive(c.children) : undefined,
      }));
    updateComponents(removeRecursive(components));
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [components, selectedComponentId, updateComponents]);

  const updateComponentProps = useCallback((id: string, props: Record<string, any>) => {
    const updateRecursive = (comps: BuilderComponent[]): BuilderComponent[] =>
      comps.map(c => {
        if (c.id === id) return { ...c, props: { ...c.props, ...props } };
        if (c.children) return { ...c, children: updateRecursive(c.children) };
        return c;
      });
    updateComponents(updateRecursive(components));
  }, [components, updateComponents]);

  const updateComponentStyles = useCallback((id: string, styles: Record<string, string>) => {
    const updateRecursive = (comps: BuilderComponent[]): BuilderComponent[] =>
      comps.map(c => {
        if (c.id === id) return { ...c, styles: { ...c.styles, ...styles } };
        if (c.children) return { ...c, children: updateRecursive(c.children) };
        return c;
      });
    updateComponents(updateRecursive(components));
  }, [components, updateComponents]);

  const moveComponent = useCallback((fromIndex: number, toIndex: number) => {
    const newComponents = [...components];
    const [moved] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, moved);
    updateComponents(newComponents);
  }, [components, updateComponents]);

  const duplicateComponent = useCallback((id: string) => {
    const findAndDuplicate = (comps: BuilderComponent[]): BuilderComponent[] => {
      const result: BuilderComponent[] = [];
      for (const c of comps) {
        result.push(c);
        if (c.id === id) {
          const cloneWithNewIds = (comp: BuilderComponent): BuilderComponent => ({
            ...comp,
            id: generateId(),
            children: comp.children?.map(cloneWithNewIds),
          });
          result.push(cloneWithNewIds(c));
        }
      }
      return result;
    };
    updateComponents(findAndDuplicate(components));
  }, [components, updateComponents]);

  const setComponentsFromAI = useCallback((newComponents: BuilderComponent[]) => {
    updateComponents(newComponents);
    setSelectedComponentId(null);
  }, [updateComponents]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(prev => prev.map(p =>
        p.id === activePageId
          ? { ...p, components: history[newIndex], updatedAt: new Date() }
          : p
      ));
    }
  }, [historyIndex, history, activePageId]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPages(prev => prev.map(p =>
        p.id === activePageId
          ? { ...p, components: history[newIndex], updatedAt: new Date() }
          : p
      ));
    }
  }, [historyIndex, history, activePageId]);

  const addPage = useCallback((name: string) => {
    const newPage: BuilderPage = {
      id: generateId(),
      name,
      components: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
  }, []);

  const deletePage = useCallback((id: string) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter(p => p.id !== id));
    if (activePageId === id) setActivePageId(pages[0].id === id ? pages[1].id : pages[0].id);
  }, [pages, activePageId]);

  const getSelectedComponent = useCallback((): BuilderComponent | null => {
    if (!selectedComponentId) return null;
    const findRecursive = (comps: BuilderComponent[]): BuilderComponent | null => {
      for (const c of comps) {
        if (c.id === selectedComponentId) return c;
        if (c.children) {
          const found = findRecursive(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findRecursive(components);
  }, [selectedComponentId, components]);

  const exportToHTML = useCallback((): string => {
    const renderComponent = (comp: BuilderComponent): string => {
      const style = comp.styles ? Object.entries(comp.styles).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ') : '';
      const styleAttr = style ? ` style="${style}"` : '';

      switch (comp.type) {
        case 'heading':
          const tag = comp.props.level || 'h2';
          return `<${tag}${styleAttr}>${comp.props.text}</${tag}>`;
        case 'paragraph':
          return `<p${styleAttr}>${comp.props.text}</p>`;
        case 'button':
          return `<a href="${comp.props.href || '#'}" class="button"${styleAttr}>${comp.props.text}</a>`;
        case 'image':
          return `<img src="${comp.props.src}" alt="${comp.props.alt || ''}"${styleAttr} />`;
        case 'divider':
          return `<hr${styleAttr} />`;
        case 'spacer':
          return `<div style="height: ${comp.props.height || '40px'}"></div>`;
        case 'container':
          return `<div class="container" style="max-width: ${comp.props.maxWidth || '1200px'}; margin: 0 auto;${style ? ' ' + style : ''}">${comp.children?.map(renderComponent).join('\n') || ''}</div>`;
        case 'grid':
          return `<div style="display: grid; grid-template-columns: repeat(${comp.props.columns || 3}, 1fr); gap: ${comp.props.gap || '20px'};${style ? ' ' + style : ''}">${comp.children?.map(renderComponent).join('\n') || ''}</div>`;
        case 'navbar':
          return `<nav${styleAttr}><div class="container" style="display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; padding: 16px;"><strong>${comp.props.brand}</strong><div style="display: flex; gap: 24px;">${(comp.props.links || []).map((l: string) => `<a href="#">${l}</a>`).join('')}</div></div></nav>`;
        case 'hero':
          return `<section style="text-align: center; padding: 80px 20px;${comp.props.bgImage ? ` background-image: url(${comp.props.bgImage}); background-size: cover;` : ''}${style ? ' ' + style : ''}"><h1>${comp.props.title}</h1><p style="font-size: 1.25rem; margin: 16px 0;">${comp.props.subtitle}</p><a href="#" class="button">${comp.props.ctaText}</a></section>`;
        case 'footer':
          return `<footer style="text-align: center; padding: 40px 20px;${style ? ' ' + style : ''}"><div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 16px;">${(comp.props.links || []).map((l: string) => `<a href="#">${l}</a>`).join('')}</div><p>${comp.props.copyright}</p></footer>`;
        case 'card':
          return `<div class="card" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;${style ? ' ' + style : ''}"><h3>${comp.props.title}</h3><p>${comp.props.description}</p></div>`;
        case 'testimonial':
          return `<blockquote style="text-align: center; padding: 40px;${style ? ' ' + style : ''}"><p style="font-size: 1.25rem; font-style: italic;">"${comp.props.quote}"</p><p style="margin-top: 16px;"><strong>${comp.props.author}</strong> — ${comp.props.role}</p></blockquote>`;
        case 'cta':
          return `<section style="text-align: center; padding: 60px 20px;${style ? ' ' + style : ''}"><h2>${comp.props.title}</h2><p>${comp.props.subtitle}</p><a href="${comp.props.buttonHref || '#'}" class="button">${comp.props.buttonText}</a></section>`;
        case 'list':
          const listTag = comp.props.ordered ? 'ol' : 'ul';
          return `<${listTag}${styleAttr}>${(comp.props.items || []).map((i: string) => `<li>${i}</li>`).join('')}</${listTag}>`;
        case 'input':
          return `<div${styleAttr}><label>${comp.props.label}</label><input type="${comp.props.type || 'text'}" placeholder="${comp.props.placeholder || ''}" /></div>`;
        case 'pricing':
          return `<div style="display: grid; grid-template-columns: repeat(${(comp.props.plans || []).length}, 1fr); gap: 24px;${style ? ' ' + style : ''}">${(comp.props.plans || []).map((p: any) => `<div class="card" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; text-align: center;"><h3>${p.name}</h3><p style="font-size: 2rem; font-weight: bold; margin: 16px 0;">${p.price}</p><ul style="list-style: none; padding: 0;">${(p.features || []).map((f: string) => `<li style="padding: 4px 0;">✓ ${f}</li>`).join('')}</ul></div>`).join('')}</div>`;
        case 'faq':
          return `<div${styleAttr}>${(comp.props.items || []).map((i: any) => `<details style="margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;"><summary style="cursor: pointer; font-weight: 600;">${i.question}</summary><p style="margin-top: 8px;">${i.answer}</p></details>`).join('')}</div>`;
        default:
          return `<div${styleAttr}>${comp.type}</div>`;
      }
    };

    const body = components.map(renderComponent).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${activePage?.name || 'My Page'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
.button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
.button:hover { background: #4f46e5; }
a { color: #6366f1; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>
${body}
</body>
</html>`;
  }, [components, activePage]);

  return {
    pages,
    activePage,
    activePageId,
    setActivePageId,
    components,
    selectedComponentId,
    setSelectedComponentId,
    addComponent,
    removeComponent,
    updateComponentProps,
    updateComponentStyles,
    moveComponent,
    duplicateComponent,
    setComponentsFromAI,
    getSelectedComponent,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    addPage,
    deletePage,
    exportToHTML,
  };
}
