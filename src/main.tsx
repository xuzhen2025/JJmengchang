import React, { Component, ErrorInfo, ReactNode } from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px",
          color: "#e11d48",
          background: "#fff1f2",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          minHeight: "100vh",
          boxSizing: "border-box"
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
            梦畅 AIGC 平台加载出错
          </h1>
          <p style={{ fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{
            background: "#ffe4e6",
            padding: "20px",
            borderRadius: "8px",
            overflowX: "auto",
            fontSize: "13px",
            lineHeight: "1.6",
            border: "1px solid #fecdd3"
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


