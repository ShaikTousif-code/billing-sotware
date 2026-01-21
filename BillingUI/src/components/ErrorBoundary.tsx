import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

interface Props {
  children: ReactNode
  onNavigateBack?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    
    // Auto-navigate back after a short delay
    setTimeout(() => {
      if (this.props.onNavigateBack) {
        this.props.onNavigateBack()
      } else if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/dashboard'
      }
    }, 2000) // Navigate back after 2 seconds
  }

  private handleGoBack = () => {
    if (this.props.onNavigateBack) {
      this.props.onNavigateBack()
    } else if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/dashboard'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-center mb-4">
              We're sorry, but something unexpected happened. Redirecting you back...
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleGoBack}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

