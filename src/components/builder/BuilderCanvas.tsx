import { BuilderComponent, ComponentType } from '@/types/builder';
import { ComponentRenderer } from './ComponentRenderer';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Trash2, Copy, GripVertical } from 'lucide-react';

interface SortableItemProps {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function SortableItem({ component, isSelected, onSelect, onDelete, onDuplicate }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: component.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <ComponentRenderer component={component} isSelected={isSelected} onSelect={onSelect} />
      {isSelected && (
        <div className="absolute -right-2 top-0 flex flex-col gap-1 z-20">
          <button
            {...attributes}
            {...listeners}
            className="p-1 bg-muted rounded shadow-sm hover:bg-accent cursor-grab"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(component.id); }}
            className="p-1 bg-muted rounded shadow-sm hover:bg-accent"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(component.id); }}
            className="p-1 bg-destructive/10 rounded shadow-sm hover:bg-destructive/20 text-destructive"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface BuilderCanvasProps {
  components: BuilderComponent[];
  selectedComponentId: string | null;
  onSelect: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddComponent: (type: ComponentType, index?: number) => void;
}

export function BuilderCanvas({
  components,
  selectedComponentId,
  onSelect,
  onMove,
  onDelete,
  onDuplicate,
  onAddComponent,
}: BuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex(c => c.id === active.id);
      const newIndex = components.findIndex(c => c.id === over.id);
      onMove(oldIndex, newIndex);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    if (type) onAddComponent(type);
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-muted/30 p-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      onClick={() => onSelect('')}
    >
      <div className="max-w-[1200px] mx-auto bg-background rounded-xl shadow-lg min-h-[600px] border border-border">
        {components.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-lg font-medium mb-1">Start building your page</p>
            <p className="text-sm">Drag components from the sidebar or use AI to generate</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {components.map(component => (
                  <SortableItem
                    key={component.id}
                    component={component}
                    isSelected={selectedComponentId === component.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
