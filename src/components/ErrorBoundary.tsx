import { Component } from 'react';
import type { ReactNode } from 'react';

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : 'Unknown error' };
  }

  componentDidCatch(error: unknown) {
    console.error('App error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {this.state.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
