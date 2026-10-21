import { createElement, lazy, useState, type ComponentType } from 'react'

/** Eager intent/data-chain imports and rendering share exactly one promise.
 * A module resolved before first render uses the real component directly,
 * avoiding a new Suspense cycle for an already downloaded module. The chosen
 * child type stays stable for the lifetime of a mount (no state-reset swap). */
export function preloadable<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let resolved: ComponentType<P> | undefined
  let pending: Promise<{ default: ComponentType<P> }> | undefined
  // Only preload() starts an import: the first render of a module nothing has requested yet, or an
  // explicit intent (navigation, prefetch). A failed import is not remembered, so the next intent
  // tries once more. Rendering never retries by itself: React re-renders an uncommitted mount after
  // every rejection, so a render-time retry would loop on a module that keeps failing.
  const preload = () => {
    if (pending) return pending
    const attempt = load().then((module) => {
      resolved = module.default
      return module
    }, (error: unknown) => {
      if (pending === attempt) pending = undefined
      throw error
    })
    pending = attempt
    // A mount waits for the newest attempt and, once that attempt has failed, reaches the error boundary.
    LazyComponent = lazy(() => attempt)
    return attempt
  }
  let LazyComponent = lazy(preload)
  function Component(props: P) {
    const [Child] = useState(() => resolved ?? LazyComponent)
    return createElement(Child, props)
  }
  return { Component, preload }
}
