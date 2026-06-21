import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render-time exceptions and displays
 * a graceful fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in dev; swap for Sentry / DataDog in production
    console.error('[EcoTrace ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#080D1A',
            color: '#F0F4FF',
            fontFamily: 'system-ui, sans-serif',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#00FF88' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8892A4', fontSize: '0.95rem', maxWidth: 400, marginBottom: 32 }}>
            EcoTrace encountered an unexpected error. Your data is safe — please refresh to continue.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre style={{
              background: 'rgba(255,71,87,0.08)',
              border: '1px solid rgba(255,71,87,0.2)',
              borderRadius: 8,
              padding: '16px 20px',
              fontSize: '0.75rem',
              color: '#FF4757',
              textAlign: 'left',
              maxWidth: 600,
              overflow: 'auto',
              marginBottom: 24,
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            aria-label="Reload the application"
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #00FF88, #0DCCB0)',
              color: '#080D1A',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Reload EcoTrace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
