import * as React from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Home,
  Save,
  FolderOpen,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  title?: string;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  onHelp?: () => void;
  className?: string;
}

/**
 * Toolbar component with standard File, Edit, View, Help menus
 * Provides consistent actions across all creative tools
 */
export default function Toolbar({
  title = "Walaw Tools",
  onNew,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onHelp,
  className,
}: ToolbarProps) {
  const [, setLocation] = useLocation();

  return (
    <div className={cn("flex items-center justify-between px-4 py-2", className)}>
      {/* Left: Logo and Menus */}
      <div className="flex items-center gap-4">
        {/* Home Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="font-semibold">{title}</span>
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* File Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onNew && (
              <DropdownMenuItem onClick={onNew}>
                New
                <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onOpen && (
              <DropdownMenuItem onClick={onOpen}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
                <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onSave && (
              <DropdownMenuItem onClick={onSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {(onNew || onOpen || onSave) && <DropdownMenuSeparator />}
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onUndo && (
              <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
                <Undo className="mr-2 h-4 w-4" />
                Undo
                <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onRedo && (
              <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
                <Redo className="mr-2 h-4 w-4" />
                Redo
                <DropdownMenuShortcut>⌘⇧Z</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onZoomIn && (
              <DropdownMenuItem onClick={onZoomIn}>
                <ZoomIn className="mr-2 h-4 w-4" />
                Zoom In
                <DropdownMenuShortcut>⌘+</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onZoomOut && (
              <DropdownMenuItem onClick={onZoomOut}>
                <ZoomOut className="mr-2 h-4 w-4" />
                Zoom Out
                <DropdownMenuShortcut>⌘-</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onFitToScreen && (
              <DropdownMenuItem onClick={onFitToScreen}>
                <Maximize className="mr-2 h-4 w-4" />
                Fit to Screen
                <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Help
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onHelp && (
              <DropdownMenuItem onClick={onHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Documentation
                <DropdownMenuShortcut>F1</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => window.open('https://github.com/haigpapa/walaw-tools', '_blank')}>
              GitHub Repository
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2">
        {onUndo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
        )}
        {onRedo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        )}
        {onSave && (
          <>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              title="Save (⌘S)"
            >
              <Save className="h-4 w-4" />
            </Button>
          </>
        )}
        {onExport && (
          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
