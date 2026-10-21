import { useEffect, useMemo, useRef, useState } from 'react'
import { NativeCnyTrendingClientError } from '../api/HttpNativeCnyTrendingGateway'
import type { HttpNativeCnyTrendingGateway, NativeCnyTrendingSelection } from '../api/HttpNativeCnyTrendingGateway'
import { BoundedJsonFetchError } from '../api/boundedJsonFetch'
import { NativeCnyTrendingViewError, nativeCnyTrendingViewModel,
  snapshotNativeCnyTrendingSelection } from './nativeCnyTrendingViewModel'
import type { NativeCnyTrendingMemberView, NativeCnyTrendingViewModel } from './nativeCnyTrendingViewModel'

/** Must be explicitly injected. No default gateway, legacy adapter or global fetch. */
export type NativeCnyTrendingPanelGateway = Pick<HttpNativeCnyTrendingGateway, 'day'>
export type NativeCnyTrendingPanelProps = Readonly<{
  gateway?: NativeCnyTrendingPanelGateway | null
  selection?: NativeCnyTrendingSelection | null
  signal?: AbortSignal
}>

type Prepared = Readonly<{ key: string; selection: NativeCnyTrendingSelection | null; invalid: boolean }>
function prepare(selection: NativeCnyTrendingPanelProps['selection']): Prepared {
  if (selection == null) return { key: 'UNSELECTED', selection: null, invalid: false }
  try {
    const snapshot = snapshotNativeCnyTrendingSelection(selection)
    return { key: JSON.stringify(snapshot), selection: snapshot, invalid: false }
  } catch {
    return { key: 'INVALID_SELECTION', selection: null, invalid: true }
  }
}
type Content =
  | Readonly<{ status: 'unselected' | 'no-gateway' | 'loading' | 'cancelled' }>
  | Readonly<{ status: 'error'; code: string }>
  | Readonly<{ status: 'ready'; view: NativeCnyTrendingViewModel }>
type BoundState = Readonly<{ key: string; gateway: NativeCnyTrendingPanelProps['gateway'];
  signal: AbortSignal | undefined; content: Content }>

function failureCode(error: unknown): string {
  if (error instanceof NativeCnyTrendingClientError || error instanceof BoundedJsonFetchError ||
      error instanceof NativeCnyTrendingViewError) {
    const known = ['INVALID_SELECTION', 'INVALID_RESPONSE', 'UNSUPPORTED_EXACT_SIZE', 'NOT_PUBLISHED',
      'TEMPORARILY_UNAVAILABLE', 'HTTP_FAILURE', 'NETWORK_UNAVAILABLE', 'REQUEST_TIMEOUT',
      'INVALID_CONTENT_TYPE', 'RESPONSE_TOO_LARGE', 'INVALID_JSON_RESPONSE']
    if (known.includes(error.code)) return error.code
  }
  return 'REQUEST_FAILED'
}

const wrapText = { overflowWrap: 'anywhere' } as const
function MemberTable({ title, members }: Readonly<{ title: string; members: readonly NativeCnyTrendingMemberView[] }>) {
  return <section aria-label={title}>
    <h3>{title}</h3>
    {members.length === 0 ? <p>此 publication 未列出该方向的成员；不代表没有活跃挂单。</p> :
      <table>
        <thead><tr><th scope="col">原始排名</th><th scope="col">物品 / 身份</th>
          <th scope="col">精确收益比（十六进制）</th><th scope="col">质量 / 来源</th></tr></thead>
        <tbody>{members.map(member => <tr key={member.analysisUnitId}>
          <td>{member.rank}</td>
          <td><span>{member.displayName}</span><br /><code style={wrapText}>{member.analysisUnitId}</code></td>
          <td><code style={wrapText}>{member.exactReturnText}</code></td>
          <td>{member.evidenceGrade}<br />支持来源数：{member.supportingSourceCount}<br />
            保守端点来源：{member.conservativeSource}</td>
        </tr>)}</tbody>
      </table>}
  </section>
}

function Publication({ view }: Readonly<{ view: NativeCnyTrendingViewModel }>) {
  const details = [
    ['publication_id', view.publicationId], ['public_sha256（正文 hash）', view.publicSha256],
    ['rights_sha256（匹配 pin，不是认证）', view.rightsSha256],
    ['readiness_review_sha256（匹配 pin，不是认证）', view.readinessReviewSha256],
    ['外部 candidate_sha256 pin', view.selectionPins.candidateSha256],
    ['外部 catalog_publication_id pin', view.selectionPins.catalogPublicationId],
    ['窗口 start_date', view.startDate], ['窗口 end_date', view.endDate],
    ['as_of', view.asOf], ['input_available_at', view.inputAvailableAt],
    ['released_at', view.releasedAt], ['外部 known_at', view.selectionPins.knownAt],
    ['evidence_class', view.evidenceClass], ['method', view.method],
  ]
  return <>
    <p>币种：{view.currency}；fx_applied：{String(view.fxApplied)}；historical_membership_qualified：{String(view.historicalMembershipQualified)}</p>
    <dl>{details.map(([label, value]) => <div key={label}>
      <dt>{label}</dt><dd><code style={wrapText}>{value}</code></dd>
    </div>)}</dl>
    {view.members.length === 0 && <p role="status">已选 publication 的成员列表为空。</p>}
    <MemberTable title="涨幅 GAINERS" members={view.gainers} />
    <MemberTable title="跌幅 LOSERS" members={view.losers} />
  </>
}

/** Standalone opt-in surface; not imported by App/PublicBetaApp.
 * Selection, gateway or external-signal changes retire the old request. Render
 * hides old data immediately, including before effect cleanup; late completions
 * cannot publish after switching, deselection, cancellation or unmount. */
export function NativeCnyTrendingPanel({ gateway, selection, signal }: NativeCnyTrendingPanelProps) {
  // Caller objects are readonly inputs. Snapshot only an explicit new props
  // identity, not later in-place mutation observed during our own state render.
  const prepared = useMemo(() => prepare(selection), [selection])
  const key = prepared.key
  const [state, setState] = useState<BoundState | null>(null)
  const cancel = useRef<Readonly<{ key: string; gateway: NativeCnyTrendingPanelProps['gateway'];
    signal: AbortSignal | undefined; abort: () => void }> | null>(null)

  useEffect(() => {
    const binding = { key, gateway, signal }
    const update = (content: Content) => setState({ ...binding, content })
    if (gateway == null) { update({ status: 'no-gateway' }); return }
    if (prepared.invalid) { update({ status: 'error', code: 'INVALID_SELECTION' }); return }
    const pinned = prepared.selection
    if (pinned === null) { update({ status: 'unselected' }); return }
    const controller = new AbortController()
    let live = true
    const onAbort = () => { if (live) update({ status: 'cancelled' }) }
    controller.signal.addEventListener('abort', onAbort, { once: true })
    const abortFromCaller = () => controller.abort()
    signal?.addEventListener('abort', abortFromCaller, { once: true })
    cancel.current = { ...binding, abort: () => controller.abort() }
    if (signal?.aborted) controller.abort()
    else {
      update({ status: 'loading' })
      void (async () => {
        try {
          const day = await gateway.day(pinned, controller.signal)
          if (!live || controller.signal.aborted) return
          update({ status: 'ready', view: nativeCnyTrendingViewModel(day, pinned) })
        } catch (error) {
          if (live && !controller.signal.aborted) update({ status: 'error', code: failureCode(error) })
        }
      })()
    }
    return () => {
      live = false
      signal?.removeEventListener('abort', abortFromCaller)
      controller.signal.removeEventListener('abort', onAbort)
      controller.abort()
      if (cancel.current?.abort !== undefined && cancel.current.key === key &&
          cancel.current.gateway === gateway && cancel.current.signal === signal) cancel.current = null
    }
    // key includes every copied selection value. Equivalent new caller objects
    // do not re-request, while an actual pin/clock change does.
  }, [gateway, key, signal])

  let content: Content
  if (gateway == null) content = { status: 'no-gateway' }
  else if (prepared.invalid) content = { status: 'error', code: 'INVALID_SELECTION' }
  else if (prepared.selection === null) content = { status: 'unselected' }
  else if (signal?.aborted) content = { status: 'cancelled' }
  else if (state?.key === key && state.gateway === gateway && state.signal === signal) content = state.content
  else content = { status: 'loading' }
  const cancelCurrent = () => {
    if (cancel.current?.key === key && cancel.current.gateway === gateway && cancel.current.signal === signal)
      cancel.current.abort()
  }
  return <section aria-label="原生 CNY Trending" aria-busy={content.status === 'loading'}>
    <h2>原生 CNY Trending · 显式 publication</h2>
    {content.status === 'no-gateway' && <p role="status">未注入原生 Trending Gateway；不会请求。</p>}
    {content.status === 'unselected' && <p role="status">未选择完整 publication / pins；不会请求。</p>}
    {content.status === 'loading' && <><p role="status">正在读取已选 publication…</p>
      <button type="button" onClick={cancelCurrent}>取消本次请求</button></>}
    {content.status === 'cancelled' && <p role="status">本次请求已取消；不自动重试。</p>}
    {content.status === 'error' && <p role="alert" data-error-code={content.code}>
      原生 Trending 读取失败：{content.code}。
      {content.code === 'UNSUPPORTED_EXACT_SIZE' && ' 精确字段超过客户端 4096 字符支持域；不进行近似兜底。'}
      不使用 latest / USD 回退，也不把错误当成空榜单。
    </p>}
    {content.status === 'ready' && <Publication view={content.view} />}
    <p>边界：原生 CNY，不进行 FX；排名沿用已解码的精确顺序，收益比原样展示，不重算方法或舍入。</p>
    <p>外部 pins 匹配不认证 rights / review，也不是生产 GO。public_sha256 是正文 hash，不是 HTTP 整包 hash。</p>
    <p>此 wire 不提供逐来源缺席或活跃挂单状态；未列出某来源不能推断为 NO_ACTIVE_ASK。</p>
    <p>精确比率字段的客户端支持上限为 4096 字符；超出时明确不支持，绝不转成浮点近似。</p>
  </section>
}
