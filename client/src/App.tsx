import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import CellMosaic from "@/pages/cell-mosaic-complete";
import ParticleSwarm from "@/pages/particle-swarm-complete";
import VectorSplit from "@/pages/vector-split-complete";
import ContourType from "@/pages/contour-type-complete";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cell-mosaic" component={CellMosaic} />
        <Route path="/particle-swarm" component={ParticleSwarm} />
        <Route path="/vector-split" component={VectorSplit} />
        <Route path="/contour-type" component={ContourType} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
