import * as React from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolLayoutProps {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  className?: string;
}

/**
 * ToolLayout provides the universal structure for creative tool pages
 * Features:
 * - Top toolbar with menus and actions
 * - Collapsible left sidebar for tool controls
 * - Main canvas area (children)
 * - Collapsible right sidebar for presets/layers/history
 * - Optional bottom bar for timeline/playback
 */
export default function ToolLayout({
  children,
  toolbar,
  leftSidebar,
  rightSidebar,
  bottomBar,
  className,
}: ToolLayoutProps) {
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);

  return (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      {/* Top Toolbar */}
      {toolbar && (
        <div className="border-b bg-card">
          {toolbar}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebar && (
          <div
            className={cn(
              "border-r bg-card transition-all duration-300 ease-in-out overflow-hidden",
              leftOpen ? "w-80" : "w-0"
            )}
          >
            <div className="w-80 h-full overflow-y-auto">
              {leftSidebar}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Sidebar Toggle Buttons */}
          <div className="absolute top-2 left-2 z-10 flex gap-2">
            {leftSidebar && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLeftOpen(!leftOpen)}
                className="bg-background/80 backdrop-blur-sm"
              >
                {leftOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <div className="absolute top-2 right-2 z-10">
            {rightSidebar && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRightOpen(!rightOpen)}
                className="bg-background/80 backdrop-blur-sm"
              >
                {rightOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>

          {/* Bottom Bar (Timeline, Playback Controls) */}
          {bottomBar && (
            <div className="border-t bg-card">
              {bottomBar}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {rightSidebar && (
          <div
            className={cn(
              "border-l bg-card transition-all duration-300 ease-in-out overflow-hidden",
              rightOpen ? "w-80" : "w-0"
            )}
          >
            <div className="w-80 h-full overflow-y-auto">
              {rightSidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
