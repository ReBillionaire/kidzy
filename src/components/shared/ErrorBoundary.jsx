import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kidzy Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">{'\u{1F622}'}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-500 mb-4 text-sm max-w-sm">
            Don't worry, your data is safe. Try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Refresh App
          </button>
          {this.props.showDetails && this.state.error && (
            <details className="mt-4 text-left max-w-sm">
              <summary className="text-xs text-gray-400 cursor-pointer">Error details</summary>
              <pre className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded-lg overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
