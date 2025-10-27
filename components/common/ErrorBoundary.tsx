import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-red-600 mb-4">
            O aplicativo encontrou um problema e não pôde continuar. Tente recarregar a página.
          </p>
          <details className="w-full max-w-lg bg-white p-3 rounded-lg border border-red-200 text-left text-sm text-gray-700">
            <summary className="font-semibold cursor-pointer">Detalhes Técnicos</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words bg-gray-50 p-2 rounded text-xs">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;