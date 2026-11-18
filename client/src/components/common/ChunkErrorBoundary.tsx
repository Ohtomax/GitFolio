import { Component, type ReactNode } from 'react';

export function PageErrorFallback({ chunk = false }: { chunk?: boolean }) {
  return <main className="mx-auto max-w-lg px-6 py-24" role="alert">
    <h1 className="text-2xl font-semibold">{chunk ? 'This page couldn’t load.' : 'Something interrupted this page.'}</h1>
    <p className="my-4 leading-7 text-stone-600">{chunk ? 'Check your connection, then reload to get the latest version.' : 'Reload to try again. Your saved projects are still available in your workspace.'}</p>
    <div className="flex flex-wrap items-center gap-4"><button type="button" className="primary-button" onClick={() => window.location.reload()}>Reload page</button><a className="text-sm font-semibold underline" href="/dashboard">Back to projects</a></div>
  </main>;
}

export class ChunkErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { failed: boolean; chunk: boolean }> {
  state = { failed: false, chunk: false };
  static getDerivedStateFromError(error: unknown) {
    return { failed: true, chunk: error instanceof Error && /dynamically imported|Loading chunk|module script|Importing a module/i.test(error.message) };
  }
  componentDidUpdate(previous: Readonly<{ children: ReactNode; resetKey?: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false, chunk: false });
  }
  render() {
    if (this.state.failed) return <PageErrorFallback chunk={this.state.chunk} />;
    return this.props.children;
  }
}
