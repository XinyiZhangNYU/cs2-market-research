import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { Lang } from '../i18n'
import { t } from '../i18n/strings'
import {
  isModuleLoadFailure,
  moduleReloadEnvironment,
  reloadAfterModuleFailure,
  reloadPage,
} from '../performance/moduleLoadRecovery'

type PublicErrorBoundaryProps = Readonly<{
  children: ReactNode
  lang: Lang
  resetKey: string
  /** False while the reader is not on this page: hidden, or left behind by a pending navigation.
   * A failure caught then does not reload the page; it is retried when the page is shown again. */
  active?: boolean
  reload?: () => void
}>

type PublicErrorBoundaryState = Readonly<{
  failed: boolean
  moduleLoad: boolean
  /** A failed module is loading the page again; the failure state is not shown meanwhile. */
  reloading: boolean
}>

const RESET: PublicErrorBoundaryState = Object.freeze({ failed: false, moduleLoad: false, reloading: false })

export class PublicErrorBoundary extends Component<
  PublicErrorBoundaryProps,
  PublicErrorBoundaryState
> {
  state: PublicErrorBoundaryState = RESET

  static getDerivedStateFromError(error: unknown): PublicErrorBoundaryState {
    return { failed: true, moduleLoad: isModuleLoadFailure(error), reloading: false }
  }

  componentDidCatch(error: unknown, _info: ErrorInfo): void {
    // The public surface deliberately reflects no exception detail. Browser observability owns
    // the diagnostic; the visible boundary remains a controlled, bilingual fail-closed state.
    // A failed module on the page the reader is on is recovered by loading that page again,
    // after its route committed, within the tab's automatic reloads (moduleLoadRecovery).
    if (this.props.active === false || !isModuleLoadFailure(error)) return
    if (reloadAfterModuleFailure(moduleReloadEnvironment(this.props.reload ?? reloadPage))) {
      this.setState({ reloading: true })
    }
  }

  componentDidUpdate(previous: PublicErrorBoundaryProps, previousState: PublicErrorBoundaryState): void {
    // Only a failure caught under earlier props is retried; one caught in this render is current.
    if (!previousState.failed || !this.state.failed) return
    const shownAgain = previous.active === false && this.props.active !== false
    if (shownAgain || previous.resetKey !== this.props.resetKey) this.setState(RESET)
  }

  // A failed module stays failed for this document, so reopening it means loading the page again.
  private readonly reset = () => {
    if (this.state.moduleLoad) (this.props.reload ?? reloadPage)()
    else this.setState(RESET)
  }

  render() {
    if (!this.state.failed) return this.props.children
    if (this.state.reloading) {
      return (
        <div className="formal-site__module-loading" role="status">
          {t('publicLoadingSurface', this.props.lang)}
        </div>
      )
    }
    return (
      <section
        className="formal-runtime-error"
        data-testid="public-runtime-error"
        role="alert"
      >
        <p>{t('publicRuntimeErrorEyebrow', this.props.lang)}</p>
        <h2>{t('publicRuntimeErrorTitle', this.props.lang)}</h2>
        <p>{t('publicRuntimeErrorNote', this.props.lang)}</p>
        <button type="button" onClick={this.reset}>
          {t('publicRuntimeErrorAction', this.props.lang)}
        </button>
      </section>
    )
  }
}
