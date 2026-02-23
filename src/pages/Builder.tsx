import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuilder } from '@/hooks/useBuilder';
import { ComponentPalette } from '@/components/builder/ComponentPalette';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { PropertiesPanel } from '@/components/builder/PropertiesPanel';
import { TemplateGallery } from '@/components/builder/TemplateGallery';
import { AIBuildChat } from '@/components/builder/AIBuildChat';
import { LivePreview } from '@/components/builder/LivePreview';
import { CodeEditor } from '@/components/builder/CodeEditor';
import { ComponentRenderer } from '@/components/builder/ComponentRenderer';
import { exportReactCode, exportAsZip } from '@/utils/builderExport';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  ArrowLeft, Undo2, Redo2, Eye, Code, Download, Moon, Sun,
  Layers, LayoutTemplate, Monitor, Tablet, Smartphone,
  Plus, X, MessageSquare, FileDown, Package, FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LeftTab = 'components' | 'templates' | 'ai';
type ViewMode = 'edit' | 'preview' | 'code';
type DeviceView = 'desktop' | 'tablet' | 'mobile';

const Builder = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [leftTab, setLeftTab] = useState<LeftTab>('ai');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const {
    pages, activePage, activePageId, setActivePageId,
    components, selectedComponentId, setSelectedComponentId,
    addComponent, removeComponent, updateComponentProps, updateComponentStyles,
    moveComponent, duplicateComponent, setComponentsFromAI,
    getSelectedComponent, undo, redo, canUndo, canRedo,
    addPage, deletePage, exportToHTML,
  } = useBuilder();

  const selectedComponent = getSelectedComponent();
  const htmlCode = useMemo(() => exportToHTML(), [exportToHTML]);
  const reactCode = useMemo(() => exportReactCode(components, activePage?.name || 'Page'), [components, activePage]);

  const handleExportHTML = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage?.name || 'page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML exported!');
  };

  const handleExportZip = async () => {
    await exportAsZip(htmlCode, reactCode, activePage?.name || 'Page');
    toast.success('ZIP downloaded!');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <header className="h-12 border-b border-border bg-card flex items-center px-3 gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="h-5 w-px bg-border" />

        {/* Page tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {pages.map(page => (
            <Button
              key={page.id}
              variant={page.id === activePageId ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-7 px-2 shrink-0"
              onClick={() => setActivePageId(page.id)}
            >
              {page.name}
              {pages.length > 1 && (
                <X className="w-3 h-3 ml-1 opacity-40 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} />
              )}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => addPage(`Page ${pages.length + 1}`)}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-7 w-7">
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-7 w-7">
          <Redo2 className="w-3.5 h-3.5" />
        </Button>

        <div className="h-5 w-px bg-border" />

        {/* Device */}
        <Button variant={deviceView === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setDeviceView('desktop')}>
          <Monitor className="w-3.5 h-3.5" />
        </Button>
        <Button variant={deviceView === 'tablet' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setDeviceView('tablet')}>
          <Tablet className="w-3.5 h-3.5" />
        </Button>
        <Button variant={deviceView === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setDeviceView('mobile')}>
          <Smartphone className="w-3.5 h-3.5" />
        </Button>

        <div className="h-5 w-px bg-border" />

        {/* View Mode */}
        <Button variant={viewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setViewMode('edit')}>
          <Layers className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button variant={viewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setViewMode('preview')}>
          <Eye className="w-3 h-3 mr-1" /> Preview
        </Button>
        <Button variant={viewMode === 'code' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setViewMode('code')}>
          <Code className="w-3 h-3 mr-1" /> Code
        </Button>

        <div className="h-5 w-px bg-border" />

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-7 w-7">
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>

        <Button size="sm" className="text-xs h-7 px-3" onClick={() => setShowExportDialog(true)}>
          <Download className="w-3 h-3 mr-1" /> Export
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-border bg-card flex flex-col overflow-hidden shrink-0">
          <Tabs value={leftTab} onValueChange={v => setLeftTab(v as LeftTab)} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b border-border h-9 bg-transparent shrink-0 px-1">
              <TabsTrigger value="ai" className="text-xs flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-1">
                <MessageSquare className="w-3 h-3" /> AI
              </TabsTrigger>
              <TabsTrigger value="components" className="text-xs flex-1 data-[state=active]:bg-muted gap-1">
                <Layers className="w-3 h-3" /> Components
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs flex-1 data-[state=active]:bg-muted gap-1">
                <LayoutTemplate className="w-3 h-3" /> Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-0 flex-1 overflow-hidden">
              <AIBuildChat onGenerate={setComponentsFromAI} existingComponents={components} />
            </TabsContent>
            <TabsContent value="components" className="mt-0 flex-1 overflow-y-auto p-3">
              <ComponentPalette onAddComponent={addComponent} />
            </TabsContent>
            <TabsContent value="templates" className="mt-0 flex-1 overflow-y-auto p-3">
              <TemplateGallery onSelectTemplate={setComponentsFromAI} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center: Canvas / Preview / Code */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'code' ? (
            <CodeEditor htmlCode={htmlCode} reactCode={reactCode} />
          ) : viewMode === 'preview' ? (
            <LivePreview html={htmlCode} deviceView={deviceView} />
          ) : (
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 overflow-auto">
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
          )}
        </div>

        {/* Right Properties Panel (edit mode only) */}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Your Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Choose your preferred export format.
            </p>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start gap-3 h-12" onClick={handleExportHTML}>
                <FileCode className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">HTML / CSS / JS</p>
                  <p className="text-xs text-muted-foreground">Standalone HTML file</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => {
                navigator.clipboard.writeText(reactCode);
                toast.success('React code copied!');
              }}>
                <FileDown className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">React + Tailwind</p>
                  <p className="text-xs text-muted-foreground">Copy React component code</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12" onClick={handleExportZip}>
                <Package className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Download as ZIP</p>
                  <p className="text-xs text-muted-foreground">Full project with HTML + React</p>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Builder;
