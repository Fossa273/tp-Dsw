import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Algo salio mal</h2>
          <p style={{ color: '#999', marginBottom: '1rem' }}>
            Ha ocurrido un error inesperado en la aplicacion.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recargar pagina
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
