import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 