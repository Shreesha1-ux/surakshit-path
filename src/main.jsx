import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Captured in ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8 font-mono flex flex-col justify-center items-center">
          <div className="max-w-xl w-full bg-neutral-900 border border-red-500/50 rounded-xl p-6 shadow-2xl">
            <h2 className="text-red-500 font-bold text-lg mb-2">⚠️ Application Error Detected</h2>
            <p className="text-neutral-400 text-xs mb-4">A runtime error occurred in the component tree:</p>
            <pre className="text-red-400 bg-black/60 p-3 rounded text-xs overflow-auto max-h-48 border border-neutral-800 mb-4 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
