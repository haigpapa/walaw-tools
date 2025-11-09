import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Grid3x3,
  Type,
  Waves,
  Volume2,
  Layers,
  GitBranch,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  status: "ready" | "coming-soon";
  color: string;
}

const tools: ToolCard[] = [
  {
    id: "cell-mosaic",
    name: "Cell Mosaic Animator",
    description: "Create animated collages with image/letter cells that reveal background images through light/dark masking effects",
    icon: <Grid3x3 className="h-8 w-8" />,
    path: "/cell-mosaic",
    status: "ready",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "particle-swarm",
    name: "Particle Image Swarm",
    description: "Reconstruct images from swarming particles with mouse interaction capabilities and recording features",
    icon: <Sparkles className="h-8 w-8" />,
    path: "/particle-swarm",
    status: "ready",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "vector-split",
    name: "Vector Split & Offset",
    description: "Import SVGs and create noise-driven animations with duplication, offset, rotation, and morphing effects",
    icon: <Waves className="h-8 w-8" />,
    path: "/vector-split",
    status: "ready",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "contour-type",
    name: "Contour Type Sampler",
    description: "Transform text into vector contours, sample points along paths, and render shapes with motion for dynamic typography",
    icon: <Type className="h-8 w-8" />,
    path: "/contour-type",
    status: "ready",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "pattern-studio",
    name: "Generative Pattern Studio",
    description: "Create infinite tileable patterns using Truchet tiles, Islamic geometry, flow fields, and more with symmetry controls",
    icon: <Layers className="h-8 w-8" />,
    path: "/pattern-studio",
    status: "ready",
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "recursive-drawing",
    name: "Recursive Drawing Machine",
    description: "Generate beautiful fractals and L-systems including trees, Koch curves, Sierpinski triangles, and dragon curves",
    icon: <GitBranch className="h-8 w-8" />,
    path: "/recursive-drawing",
    status: "ready",
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "audio-visualizer",
    name: "Audio Visualizer Composer",
    description: "Create stunning audio visualizations with real-time frequency analysis, multiple render modes, and live microphone input",
    icon: <Music className="h-8 w-8" />,
    path: "/audio-visualizer",
    status: "ready",
    color: "from-rose-500 to-pink-500",
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Walaw Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A web-based collection of generative art and design tools. Explore, create, and bring your creative visions to life.
          </p>
        </div>

        {/* Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "group relative bg-card border rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
                tool.status === "coming-soon" && "opacity-60"
              )}
              onClick={() => tool.status === "ready" && setLocation(tool.path)}
            >
              {/* Gradient Background */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                  tool.color
                )}
              />

              <div className="relative">
                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 p-3 rounded-lg bg-gradient-to-br w-fit",
                    tool.color
                  )}
                >
                  {tool.icon}
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold mb-2">{tool.name}</h2>
                <p className="text-muted-foreground mb-4 min-h-[60px]">
                  {tool.description}
                </p>

                {/* Action */}
                <div className="flex items-center justify-between">
                  {tool.status === "ready" ? (
                    <Button variant="ghost" className="group-hover:bg-primary/10">
                      Open Tool →
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                  <Zap className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Features & Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">Creative Freedom</h3>
              <p className="text-sm text-muted-foreground">
                Powerful tools designed for artists, designers, and creative technologists
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">Real-time Preview</h3>
              <p className="text-sm text-muted-foreground">
                See your changes instantly with high-performance rendering
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Volume2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">Export Options</h3>
              <p className="text-sm text-muted-foreground">
                Export your creations in multiple formats for any use case
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
