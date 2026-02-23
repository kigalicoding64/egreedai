import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BuilderComponent } from '@/types/builder';

export function exportReactCode(components: BuilderComponent[], pageName: string): string {
  const renderComponent = (comp: BuilderComponent, indent: string = '      '): string => {
    const styleStr = comp.styles && Object.keys(comp.styles).length > 0
      ? ` style={${JSON.stringify(comp.styles)}}`
      : '';

    switch (comp.type) {
      case 'heading': {
        const Tag = comp.props.level || 'h2';
        const cls = { h1: 'text-5xl font-bold', h2: 'text-4xl font-bold', h3: 'text-3xl font-semibold', h4: 'text-2xl font-semibold' }[Tag] || 'text-2xl font-bold';
        return `${indent}<${Tag} className="${cls}"${styleStr}>${comp.props.text}</${Tag}>`;
      }
      case 'paragraph':
        return `${indent}<p className="text-base leading-relaxed text-gray-600"${styleStr}>${comp.props.text}</p>`;
      case 'button':
        return `${indent}<a href="${comp.props.href || '#'}" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"${styleStr}>${comp.props.text}</a>`;
      case 'image':
        return `${indent}<img src="${comp.props.src}" alt="${comp.props.alt || ''}" className="max-w-full h-auto rounded-lg"${styleStr} />`;
      case 'divider':
        return `${indent}<hr className="border-gray-200 my-6"${styleStr} />`;
      case 'spacer':
        return `${indent}<div style={{ height: '${comp.props.height || '40px'}' }} />`;
      case 'navbar':
        return `${indent}<nav className="border-b border-gray-200"${styleStr}>
${indent}  <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-4">
${indent}    <span className="text-xl font-bold">${comp.props.brand}</span>
${indent}    <div className="flex gap-6">
${(comp.props.links || []).map((l: string) => `${indent}      <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">${l}</a>`).join('\n')}
${indent}    </div>
${indent}  </div>
${indent}</nav>`;
      case 'hero':
        return `${indent}<section className="text-center py-20 px-6 bg-gradient-to-br from-indigo-50 to-purple-50"${styleStr}>
${indent}  <h1 className="text-5xl font-bold mb-4">${comp.props.title}</h1>
${indent}  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">${comp.props.subtitle}</p>
${indent}  <a href="#" className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">${comp.props.ctaText}</a>
${indent}</section>`;
      case 'footer':
        return `${indent}<footer className="border-t border-gray-200 text-center py-10 px-6"${styleStr}>
${indent}  <div className="flex justify-center gap-6 mb-4">
${(comp.props.links || []).map((l: string) => `${indent}    <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">${l}</a>`).join('\n')}
${indent}  </div>
${indent}  <p className="text-sm text-gray-400">${comp.props.copyright}</p>
${indent}</footer>`;
      case 'card':
        return `${indent}<div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm"${styleStr}>
${indent}  <h3 className="text-lg font-semibold mb-2">${comp.props.title}</h3>
${indent}  <p className="text-gray-500 text-sm">${comp.props.description}</p>
${indent}</div>`;
      case 'grid':
        return `${indent}<div className="grid grid-cols-${comp.props.columns || 3} gap-${parseInt(comp.props.gap) || 6}"${styleStr}>
${(comp.children || []).map(c => renderComponent(c, indent + '  ')).join('\n')}
${indent}</div>`;
      case 'container':
        return `${indent}<div className="max-w-6xl mx-auto px-4"${styleStr}>
${(comp.children || []).map(c => renderComponent(c, indent + '  ')).join('\n')}
${indent}</div>`;
      case 'testimonial':
        return `${indent}<blockquote className="text-center py-10 px-6"${styleStr}>
${indent}  <p className="text-xl italic mb-4">"${comp.props.quote}"</p>
${indent}  <p className="font-semibold">${comp.props.author}</p>
${indent}  <p className="text-sm text-gray-500">${comp.props.role}</p>
${indent}</blockquote>`;
      case 'cta':
        return `${indent}<section className="text-center py-16 px-6 bg-indigo-50"${styleStr}>
${indent}  <h2 className="text-3xl font-bold mb-3">${comp.props.title}</h2>
${indent}  <p className="text-gray-600 mb-6">${comp.props.subtitle}</p>
${indent}  <a href="${comp.props.buttonHref || '#'}" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold">${comp.props.buttonText}</a>
${indent}</section>`;
      case 'pricing':
        return `${indent}<div className="grid grid-cols-${(comp.props.plans || []).length} gap-6 px-8"${styleStr}>
${(comp.props.plans || []).map((p: any) => `${indent}  <div className="border border-gray-200 rounded-xl p-8 text-center bg-white">
${indent}    <h3 className="text-lg font-semibold">${p.name}</h3>
${indent}    <p className="text-4xl font-bold my-4">${p.price}</p>
${indent}    <ul className="space-y-2 mb-6">
${(p.features || []).map((f: string) => `${indent}      <li className="text-sm">✓ ${f}</li>`).join('\n')}
${indent}    </ul>
${indent}    <a href="#" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Choose Plan</a>
${indent}  </div>`).join('\n')}
${indent}</div>`;
      case 'faq':
        return `${indent}<div className="max-w-2xl mx-auto"${styleStr}>
${(comp.props.items || []).map((item: any) => `${indent}  <details className="border-b border-gray-200 py-4">
${indent}    <summary className="cursor-pointer font-semibold">${item.question}</summary>
${indent}    <p className="mt-2 text-gray-500 text-sm">${item.answer}</p>
${indent}  </details>`).join('\n')}
${indent}</div>`;
      case 'list': {
        const Tag = comp.props.ordered ? 'ol' : 'ul';
        const cls = comp.props.ordered ? 'list-decimal' : 'list-disc';
        return `${indent}<${Tag} className="${cls} pl-6 space-y-1"${styleStr}>
${(comp.props.items || []).map((item: string) => `${indent}  <li className="text-sm">${item}</li>`).join('\n')}
${indent}</${Tag}>`;
      }
      case 'input':
        return `${indent}<div${styleStr}>
${indent}  <label className="block text-sm font-medium mb-1">${comp.props.label}</label>
${indent}  <input type="${comp.props.type || 'text'}" placeholder="${comp.props.placeholder || ''}" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
${indent}</div>`;
      default:
        return `${indent}<div${styleStr}>{/* ${comp.type} */}</div>`;
    }
  };

  const componentBody = components.map(c => renderComponent(c)).join('\n');

  return `import React from 'react';

export default function ${pageName.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <div className="min-h-screen bg-white">
${componentBody}
    </div>
  );
}`;
}

export async function exportAsZip(htmlCode: string, reactCode: string, pageName: string) {
  const zip = new JSZip();

  // HTML version
  zip.file('index.html', htmlCode);

  // Extract CSS
  const cssMatch = htmlCode.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) {
    zip.file('styles.css', cssMatch[1].trim());
  }

  // React version
  const reactFolder = zip.folder('react');
  reactFolder?.file(`${pageName}.tsx`, reactCode);
  reactFolder?.file('package.json', JSON.stringify({
    name: pageName.toLowerCase(),
    version: '1.0.0',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.0', vite: '^5.4.0', tailwindcss: '^3.4.0', autoprefixer: '^10.4.0', postcss: '^8.4.0' },
  }, null, 2));
  reactFolder?.file('README.md', `# ${pageName}\n\nGenerated by EgreedAI Builder\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${pageName.toLowerCase()}.zip`);
}
