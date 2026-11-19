import { Component, type ReactNode } from 'react';

type PreviewErrorBoundaryProps = { children: ReactNode; resetKey?: string; message?: string };
export class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous: Readonly<PreviewErrorBoundaryProps>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) return <section role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-stone-900">
      <h2 className="text-lg font-semibold">The preview couldn’t render.</h2>
      <p className="my-4 text-sm leading-6">{this.props.message ?? 'Your editor is still available. You can adjust the content, save your work, or try the preview again.'}</p>
      <button type="button" className="primary-button" onClick={() => this.setState({ failed: false })}>Try preview again</button>
    </section>;
    return this.props.children;
  }
}
