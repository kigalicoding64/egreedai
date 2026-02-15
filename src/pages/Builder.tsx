import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuilder } from '@/hooks/useBuilder';
import { ComponentPalette } from '@/components/builder/ComponentPalette';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { PropertiesPanel } from '@/components/builder/PropertiesPanel';
import { TemplateGallery } from '@/components/builder/TemplateGallery';
import { AIPromptBar } from '@/components/builder/AIPromptBar';
import { ComponentRenderer } from '@/components/builder/ComponentRenderer';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  ArrowLeft, Undo2, Redo2, Eye, Code, Download, Moon, Sun,
  Layers, LayoutTemplate, FileCode, X, Monitor, Tablet, Smartphone,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SidebarTab = 'components' | 'templates';
type ViewMode = 'edit' | 'preview' | 'code';
type DeviceView = 'desktop' | 'tablet' | 'mobile';

const Builder = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('components');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const {
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
    canUndo,
    canRedo,
    addPage,
    deletePage,
    exportToHTML,
  } = useBuilder();

  const selectedComponent = getSelectedComponent();

  const handleExportHTML = () => {
    const html = exportToHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage?.name || 'page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML exported successfully!');
  };

  const handleCopyCode = () => {
    const html = exportToHTML();
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard!');
  };

  const canvasMaxWidth = deviceView === 'desktop' ? '100%' : deviceView === 'tablet' ? '768px' : '375px';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Back to Chat">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          {pages.map(page => (
            <Button
              key={page.id}
              variant={page.id === activePageId ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setActivePageId(page.id)}
            >
              {page.name}
              {pages.length > 1 && (
                <X className="w-3 h-3 ml-1 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} />
              )}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addPage(`Page ${pages.length + 1}`)}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo" className="h-8 w-8">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo" className="h-8 w-8">
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button variant={deviceView === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceView('desktop')}>
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant={deviceView === 'tablet' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceView('tablet')}>
            <Tablet className="w-4 h-4" />
          </Button>
          <Button variant={deviceView === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceView('mobile')}>
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button variant={viewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-8" onClick={() => setViewMode('edit')}>
            <Layers className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button variant={viewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-8" onClick={() => setViewMode('preview')}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
          </Button>
          <Button variant={viewMode === 'code' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-8" onClick={() => setViewMode('code')}>
            <Code className="w-3.5 h-3.5 mr-1" /> Code
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button size="sm" className="text-xs h-8" onClick={() => setShowExportDialog(true)}>
          <Download className="w-3.5 h-3.5 mr-1" /> Export
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {viewMode === 'edit' && (
          <div className="w-64 border-r border-border bg-card flex flex-col overflow-hidden shrink-0">
            <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as SidebarTab)} className="flex flex-col h-full">
              <TabsList className="w-full rounded-none border-b border-border h-10 bg-transparent shrink-0">
                <TabsTrigger value="components" className="text-xs flex-1 data-[state=active]:bg-muted">
                  <Layers className="w-3.5 h-3.5 mr-1" /> Components
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs flex-1 data-[state=active]:bg-muted">
                  <LayoutTemplate className="w-3.5 h-3.5 mr-1" /> Templates
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto p-3">
                <TabsContent value="components" className="mt-0">
                  <ComponentPalette onAddComponent={addComponent} />
                </TabsContent>
                <TabsContent value="templates" className="mt-0">
                  <TemplateGallery onSelectTemplate={setComponentsFromAI} />
                </TabsContent>
              </div>
            </Tabs>

            <AIPromptBar onGenerate={setComponentsFromAI} existingComponents={components} />
          </div>
        )}

        {/* Canvas / Preview / Code */}
        {viewMode === 'code' ? (
          <div className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> Generated HTML
                </h3>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  Copy Code
                </Button>
              </div>
              <pre className="bg-card border border-border rounded-lg p-4 text-sm overflow-auto max-h-[calc(100vh-200px)] font-mono">
                <code>{exportToHTML()}</code>
              </pre>
            </div>
          </div>
        ) : viewMode === 'preview' ? (
          <div className="flex-1 overflow-auto bg-muted/30 flex justify-center p-8">
            <div
              className="bg-background rounded-xl shadow-lg border border-border overflow-auto"
              style={{ maxWidth: canvasMaxWidth, width: '100%' }}
            >
              {components.map(component => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  isSelected={false}
                  onSelect={() => {}}
                  isPreview
                />
              ))}
              {components.length === 0 && (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  No components to preview
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden" style={{ maxWidth: `calc(100% - ${selectedComponent ? '320px' : '0px'} - 256px)` }}>
            <div className="flex-1 overflow-auto flex justify-center">
              <div style={{ maxWidth: canvasMaxWidth, width: '100%' }}>
                <BuilderCanvas
                  components={components}
                  selectedComponentId={selectedComponentId}
                  onSelect={setSelectedComponentId}
                  onMove={moveComponent}
                  onDelete={removeComponent}
                  onDuplicate={duplicateComponent}
                  onAddComponent={addComponent}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Properties Panel */}
        {viewMode === 'edit' && selectedComponent && (
          <PropertiesPanel
            component={selectedComponent}
            onUpdateProps={updateComponentProps}
            onUpdateStyles={updateComponentStyles}
            onClose={() => setSelectedComponentId(null)}
          />
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your page as a standalone HTML file that works anywhere.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExportHTML} className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Download HTML
              </Button>
              <Button variant="outline" onClick={handleCopyCode} className="flex-1">
                <Code className="w-4 h-4 mr-2" /> Copy Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Builder;
