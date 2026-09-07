"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  appName: string;
}

interface State {
  error: Error | null;
}

/** Keeps one broken module from crashing the whole ERP shell. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[VITTA] module "${this.props.appName}" crashed:`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="text-4xl font-bold text-[#714B67]">:(</div>
          <h2 className="text-lg font-semibold">The {this.props.appName} app hit an error</h2>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
