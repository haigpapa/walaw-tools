# Phase 1: Foundation - Features Documentation

This document explains all the features implemented in Phase 1 of Walaw Tools development.

## 🎨 Universal Layout System

### Components

#### `AppLayout`
Base wrapper for all pages, provides consistent styling.

```tsx
<AppLayout>
  <YourPageContent />
</AppLayout>
```

#### `ToolLayout`
Complete tool structure with toolbar, sidebars, and canvas area.

```tsx
<ToolLayout
  toolbar={<Toolbar {...} />}
  leftSidebar={<YourControls />}
  rightSidebar={<YourPresets />}
  bottomBar={<YourTimeline />} // Optional
>
  <YourCanvas />
</ToolLayout>
```

Features:
- Collapsible left and right sidebars
- Toggle buttons with smooth animations
- Flexible bottom bar for timelines
- Responsive layout

#### `Toolbar`
Standardized toolbar with File, Edit, View, Help menus.

```tsx
<Toolbar
  title="My Tool"
  onNew={() => {}}
  onSave={() => {}}
  onExport={() => {}}
  onUndo={() => {}}
  onRedo={() => {}}
  canUndo={canUndo}
  canRedo={canRedo}
  onZoomIn={() => {}}
  onZoomOut={() => {}}
  onFitToScreen={() => {}}
  onHelp={() => {}}
/>
```

#### `ControlPanel`
Collapsible sections for organizing tool parameters.

```tsx
<ControlPanel title="Settings" defaultOpen>
  <YourControls />
</ControlPanel>
```

---

## 🖼️ Interactive Canvas

### `InteractiveCanvas`
A canvas component with zoom, pan, and grid controls.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const [controls, setControls] = useState<CanvasControls | null>(null);

<InteractiveCanvas
  ref={canvasRef}
  width={800}
  height={600}
  showGrid={true}
  gridSize={20}
  onControlsChange={setControls}
>
  {(ctx, controls) => {
    // Your render function
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 100, 100);
  }}
</InteractiveCanvas>
```

Features:
- **Mouse wheel zoom**: Scroll to zoom in/out (0.1x to 10x)
- **Click and drag**: Pan around the canvas
- **Grid overlay**: Optional grid for alignment
- **Zoom indicator**: Shows current zoom percentage
- **Programmatic control**: Use `controls` object for zoom/pan methods

CanvasControls API:
```tsx
controls.zoom          // Current zoom level
controls.pan           // Current pan position {x, y}
controls.zoomIn()      // Zoom in by 20%
controls.zoomOut()     // Zoom out by 20%
controls.fitToScreen() // Fit canvas to viewport
controls.resetView()   // Reset to default view
```

---

## 💾 Preset System

### `usePresets` Hook
Manage presets with localStorage persistence.

```tsx
const {
  presets,
  savePreset,
  loadPreset,
  deletePreset,
  exportPresets,
  importPresets
} = usePresets<MyStateType>({
  toolName: 'my-tool',
  defaultPresets: [
    {
      id: 'default',
      name: 'Default',
      description: 'Default settings',
      data: { /* your state */ },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ]
});

// Save current state as preset
savePreset('My Preset', 'Description', currentState);

// Load a preset
const data = loadPreset('preset-id');

// Delete a preset (cannot delete default presets)
deletePreset('preset-id');

// Export all presets to JSON file
exportPresets();

// Import presets from file
importPresets(file);
```

Features:
- Auto-save to localStorage
- Default presets that can't be deleted
- Import/export as JSON
- Toast notifications for all operations

---

## 📂 Project Management

### `useProject` Hook
Save/load complete projects with metadata.

```tsx
const {
  project,
  hasUnsavedChanges,
  createNew,
  updateData,
  save,
  load,
  getRecentProjects,
  exportToFile,
  importFromFile,
  rename
} = useProject<MyStateType>({
  toolName: 'my-tool',
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
});

// Create new project
createNew(initialData, 'Project Name');

// Update project data
updateData(newState);

// Save to localStorage
save();

// Load from localStorage
load('project-id');

// Get list of recent projects
const recent = getRecentProjects();

// Export to JSON file
exportToFile();

// Import from file
importFromFile(file);

// Rename project
rename('New Name');
```

Features:
- Auto-save with configurable interval
- Warns before leaving with unsaved changes
- Recent projects list (last 10)
- Import/export as JSON
- Project metadata (name, dates, version)

---

## ⌨️ Keyboard Shortcuts

### `useKeyboardShortcuts` Hook
Register custom keyboard shortcuts.

```tsx
useKeyboardShortcuts([
  {
    key: 's',
    meta: true,
    handler: handleSave,
    description: 'Save'
  },
  {
    key: 'z',
    meta: true,
    shift: true,
    handler: handleRedo,
    description: 'Redo'
  },
]);
```

### `useCommonShortcuts` Hook
Pre-configured common shortcuts.

```tsx
useCommonShortcuts({
  onSave: handleSave,          // ⌘S
  onNew: handleNew,            // ⌘N
  onOpen: handleOpen,          // ⌘O
  onExport: handleExport,      // ⌘E
  onUndo: handleUndo,          // ⌘Z
  onRedo: handleRedo,          // ⌘⇧Z
  onZoomIn: handleZoomIn,      // ⌘+
  onZoomOut: handleZoomOut,    // ⌘-
  onFitToScreen: handleFit,    // ⌘0
  onHelp: handleHelp,          // F1
});
```

Features:
- Cross-platform (⌘ on Mac, Ctrl on Windows/Linux)
- Modifier keys: Ctrl, Meta (Cmd), Shift, Alt
- Prevents default browser actions
- Easy to use and extend

Standard Shortcuts:
- `⌘N` - New project
- `⌘O` - Open project
- `⌘S` - Save project
- `⌘E` - Export
- `⌘Z` - Undo
- `⌘⇧Z` - Redo
- `⌘+` / `⌘=` - Zoom in
- `⌘-` - Zoom out
- `⌘0` - Fit to screen
- `F1` - Help

---

## ↩️ Undo/Redo System

### `useHistory` Hook
Complete undo/redo functionality.

```tsx
const {
  state,
  setState,
  undo,
  redo,
  canUndo,
  canRedo,
  clear,
  reset,
  history
} = useHistory<MyStateType>({
  initialState: defaultState,
  maxHistorySize: 50
});

// Update state (adds to history)
setState(newState);
setState(prev => ({ ...prev, value: 10 }));

// Undo/Redo
undo();
redo();

// Check if undo/redo available
if (canUndo) undo();
if (canRedo) redo();

// History info
console.log(history.past.length);   // Number of past states
console.log(history.future.length); // Number of future states
console.log(history.size);          // Total history size
```

Features:
- Configurable history size
- Efficient state comparison (skips duplicates)
- Clear history or reset to initial
- Jump to specific past state
- Returns current state for easy integration

---

## 📤 Export System

### Export Functions

#### `exportCanvas`
Export canvas to image formats.

```tsx
import { exportCanvas, getExportFilename } from '@/lib/export';

const filename = getExportFilename('my-project', 'png');
await exportCanvas(canvasRef.current, filename, {
  format: 'png',      // 'png' | 'jpg' | 'webp'
  quality: 0.92,      // 0-1 for JPG/WebP
  backgroundColor: '#ffffff',  // For JPG (no transparency)
  scale: 2,           // 2x resolution
});
```

#### `CanvasRecorder`
Record canvas animations.

```tsx
import { CanvasRecorder } from '@/lib/export';

const recorder = new CanvasRecorder(canvasRef.current);

// Start recording
await recorder.startRecording({
  mimeType: 'video/webm',
  videoBitsPerSecond: 2500000
});

// ... render animation ...

// Stop and download
await recorder.stopRecording('animation.webm');
```

#### Other Export Functions

```tsx
// Export SVG
exportSVG(svgElement, 'design.svg');

// Export JSON
exportJSON(data, 'data.json');

// Export Text
exportText('content', 'notes.txt');
```

Supported Formats:
- **Images**: PNG, JPG, WebP
- **Video**: WebM (via CanvasRecorder)
- **Vector**: SVG
- **Data**: JSON, TXT

---

## 🎯 Complete Integration Example

See `client/src/pages/cell-mosaic-enhanced.tsx` for a complete example that uses all features:

```tsx
import { useHistory } from '@/hooks/use-history';
import { usePresets } from '@/hooks/use-presets';
import { useProject } from '@/hooks/use-project';
import { useCommonShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { InteractiveCanvas } from '@/components/canvas/interactive-canvas';
import { exportCanvas } from '@/lib/export';

function MyTool() {
  // State with undo/redo
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
    initialState: defaultState
  });

  // Presets
  const { presets, savePreset, loadPreset } = usePresets({
    toolName: 'my-tool',
    defaultPresets: [...]
  });

  // Project management
  const { project, save, exportToFile } = useProject({
    toolName: 'my-tool',
    autoSave: true
  });

  // Keyboard shortcuts
  useCommonShortcuts({
    onSave: save,
    onUndo: undo,
    onRedo: redo,
    // ... etc
  });

  return (
    <ToolLayout
      toolbar={<Toolbar onSave={save} onUndo={undo} onRedo={redo} />}
      leftSidebar={<Controls state={state} setState={setState} />}
      rightSidebar={<Presets presets={presets} loadPreset={loadPreset} />}
    >
      <InteractiveCanvas>
        {(ctx) => {
          // Render your content
        }}
      </InteractiveCanvas>
    </ToolLayout>
  );
}
```

---

## 🎨 UI Component Library

All components built with shadcn/ui for consistency and accessibility:

### Form Components
- `Button` - Multiple variants (default, outline, ghost, destructive)
- `Input` - Text input with validation states
- `Label` - Accessible form labels
- `Slider` - Range input with custom styling
- `Switch` - Toggle switch

### Feedback Components
- `Toast` / `Toaster` - Non-blocking notifications
- `Tooltip` - Hover tooltips
- `Alert` - Important messages

### Navigation Components
- `DropdownMenu` - Dropdown menus with keyboard navigation

### Data Display
- `HoverCard` - Rich hover previews
- `Chart` - Data visualization (Recharts)

All components:
- Fully accessible (ARIA, keyboard navigation)
- Customizable with Tailwind CSS
- Dark mode ready
- TypeScript typed

---

## 🚀 Next Steps

Phase 1 is complete! Next phases will add:

**Phase 2: Core Tools**
- Implement actual rendering for all 4 tools
- Add p5.js and Paper.js integration
- Build timeline/animation systems
- Add more export formats (GIF, MP4)

**Phase 3: Community**
- User authentication
- Public gallery
- Social features (likes, comments, follows)
- Preset marketplace

**Phase 4: Advanced**
- Real-time collaboration
- Plugin system
- API access
- Mobile/tablet optimization

---

## 📚 Utility Functions

### `lib/utils.ts`

```tsx
import { cn, downloadFile, formatFileSize, debounce, generateId } from '@/lib/utils';

// Merge Tailwind classes
const className = cn('base-class', condition && 'conditional-class');

// Download file
downloadFile('data.json', jsonBlob);

// Format file size
formatFileSize(1024); // "1 KB"

// Debounce function
const debouncedSave = debounce(save, 1000);

// Generate unique ID
const id = generateId(); // "1699564892345-x3k9m2"
```

---

## 🎓 Best Practices

1. **State Management**: Use `useHistory` for any state that users might want to undo
2. **Keyboard Shortcuts**: Always provide keyboard shortcuts for common actions
3. **Auto-save**: Enable auto-save for better UX, but show save indicator
4. **Presets**: Provide good default presets to help users get started
5. **Export**: Offer multiple export formats with sensible defaults
6. **Toast Notifications**: Give feedback for all user actions
7. **Accessibility**: All components are keyboard-navigable and screen-reader friendly

---

For examples and implementation details, see:
- `client/src/pages/cell-mosaic-enhanced.tsx` - Complete working example
- `client/src/hooks/` - All hook implementations
- `client/src/components/` - All component implementations
