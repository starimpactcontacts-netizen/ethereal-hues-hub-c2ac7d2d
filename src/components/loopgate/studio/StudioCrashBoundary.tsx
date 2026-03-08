import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import GatePattern from "@/components/loopgate/GatePattern";

type StudioCrashBoundaryProps = {
  children: ReactNode;
  onReset: () => void;
};

type StudioCrashBoundaryState = {
  hasError: boolean;
};

export default class StudioCrashBoundary extends Component<StudioCrashBoundaryProps, StudioCrashBoundaryState> {
  state: StudioCrashBoundaryState = { hasError: false };

  static getDerivedStateFromError(): StudioCrashBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Studio runtime crashed:", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        <GatePattern className="absolute inset-0 z-0" opacity={5} color="white" tileSize={52} />
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(140% 120% at 20% 0%, hsl(0 0% 100% / 0.08) 0%, transparent 48%), linear-gradient(160deg, hsl(0 0% 2%) 0%, hsl(0 0% 4%) 42%, hsl(0 0% 1%) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card/75 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/70">
            <AlertTriangle className="h-5 w-5 text-foreground" />
          </div>
          <h2 className="text-2xl font-display text-foreground">Studio Recovered</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We caught a runtime crash and safely paused this session.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <RefreshCcw className="h-4 w-4" />
            Reload Studio
          </button>
        </div>
      </div>
    );
  }
}
