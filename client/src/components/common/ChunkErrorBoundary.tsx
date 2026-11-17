import { Component, type ReactNode } from 'react';

export class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="mx-auto max-w-lg px-6 py-24" role="alert">
      <h1 className="text-2xl font-semibold">This page couldn’t load.</h1>
      <p className="my-4 text-stone-600">Check your connection, then reload to get the latest version.</p>
      <button className="primary-button" onClick={() => window.location.reload()}>Reload page</button>
    </main>;
    return this.props.children;
  }
}
