import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  html: string;
  deviceView: 'desktop' | 'tablet' | 'mobile';
}

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' };

export function LivePreview({ html, deviceView }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }, [html, iframeKey]);

  return (
    <div className="flex-1 overflow-auto bg-muted/30 flex justify-center p-4">
      <div
        className={cn(
          "bg-background rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-300",
          deviceView !== 'desktop' && "mx-auto"
        )}
        style={{
          width: DEVICE_WIDTHS[deviceView],
          maxWidth: '100%',
          height: deviceView === 'mobile' ? '812px' : deviceView === 'tablet' ? '1024px' : '100%',
          minHeight: '600px',
        }}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
