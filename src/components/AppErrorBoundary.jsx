import { AlertOctagon } from 'lucide-react';
import { Component } from 'react';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('App rendering error:', error);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen p-4 md:p-6 font-sans bastion-app flex items-center justify-center">
        <section className="glass-panel bastion-surface p-6 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 p-3 mb-4">
            <AlertOctagon className="text-red-400" size={20} />
          </div>
          <h1 className="text-2xl bastion-heading">Interface Recovery</h1>
          <p className="mt-2 text-sm text-bastion-text-mid">
            The dashboard encountered a rendering problem. Reload to restore a clean state.
          </p>
          <button type="button" className="bastion-primary-btn mt-5" onClick={this.handleReload}>
            Reload Interface
          </button>
        </section>
      </main>
    );
  }
}
