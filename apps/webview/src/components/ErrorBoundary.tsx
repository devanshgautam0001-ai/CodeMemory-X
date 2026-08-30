import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Webview Error Boundary Catch:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center bg-background text-text-primary">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 text-red-400">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-base font-bold mb-1">View Render Error</h2>
          <p className="text-xs text-text-secondary max-w-md mb-4 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-accent text-accent-contrast rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
          >
            <RefreshCw size={14} />
            <span>Reload View State</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
