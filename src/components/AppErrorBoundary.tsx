import { WarningCircle } from "@phosphor-icons/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
  resetKey: number;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WAIC visitor guide render failed", error, info);
  }

  private retry = () => {
    this.setState(({ resetKey }) => ({ error: null, resetKey: resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell error-shell">
          <main className="error-boundary-page">
            <section role="alert" aria-labelledby="data-error-title">
              <WarningCircle aria-hidden="true" weight="duotone" />
              <p className="eyebrow">WAIC 2026 VISITOR GUIDE</p>
              <h1 id="data-error-title">数据暂时无法读取</h1>
              <p>
                请重试加载。若问题持续，活动源表仍可由项目维护者从以下路径核对。
              </p>
              <code>source-data/WAIC-2026-full-schedule.xlsx</code>
              <button className="button button-primary" type="button" onClick={this.retry}>
                重试加载
              </button>
            </section>
          </main>
        </div>
      );
    }

    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
