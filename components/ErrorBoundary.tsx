
import React, { ErrorInfo, ReactNode, Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-edu border border-gray-100 max-w-sm w-full">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-brand-text mb-2">Ops, algo deu errado!</h2>
            <p className="text-brand-text-secondary mb-6 text-sm">
              O Professor Nutri tropeçou em um bug. Não se preocupe, seus dados estão seguros.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors shadow-lg"
            >
              <RefreshCcw size={18} />
              Recarregar Aplicativo
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6 text-left bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
                    <p className="text-[10px] font-mono text-red-600 break-all">
                        {this.state.error.toString()}
                    </p>
                </div>
            )}
          </div>
        </div>
      );
    }

    // Explicit type assertion to avoid TypeScript error
    return (this as any).props.children;
  }
}

export default ErrorBoundary;
