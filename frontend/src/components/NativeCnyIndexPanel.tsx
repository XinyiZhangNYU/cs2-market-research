import { useEffect, useState } from 'react'
import './NativeCnyIndexPanel.css'
import {
  nativeCnyIndexCnyText,
  nativeCnyIndexDecimalText,
  nativeCnyIndexView,
  type NativeCnyIndexView,
} from '../adapter/nativeCnyIndexViewModel'
import {
  NativeCnyIndexWireError,
  snapshotNativeCnyIndexRequest,
  type NativeCnyIndexPublicDay,
  type NativeCnyIndexReadResult,
  type NativeCnyIndexRequest,
} from '../wire/nativeCnyIndexPublicApi'

export interface NativeCnyIndexPanelGateway {
  read(request: NativeCnyIndexRequest, options?: Readonly<{ signal?: AbortSignal }>): Promise<NativeCnyIndexReadResult>
}

type Selection = Readonly<{ key: string; target: NativeCnyIndexRequest | null; invalid: boolean }>
type Outcome = Readonly<{ kind: 'LOADING' }>
  | Readonly<{ kind: 'READY'; view: NativeCnyIndexView }>
  | Readonly<{ kind: 'PROBLEM'; code: string }>
type ReadState = Readonly<{ key: string; gateway: NativeCnyIndexPanelGateway; attempt: number; outcome: Outcome }>

const COPY = {
  zh: {
    title: '原生 CNY 指数（显式发布目标）', unselected: '尚未选择完整的外部发布目标；不发起读取。',
    loading: '正在读取所选发布目标…', problem: '所选目标不可用或校验失败。', retry: '重试同一目标',
    scope: '范围', pins: '调用者提供的历史发布目标', days: '已发布日', missing: '缺少发布的日期',
    noMissing: '此窗口没有缺少发布的日期。', disclosure: '精确展示串原样显示；不转换 FX、不补缺日、不重算收益、不绘图或推断连线。',
    admission: '目标匹配不认证 rights/review 或生产准入。public_sha256 是整份发布原件的标识，不是此范围筛选响应的重算哈希。',
    semantics: '融合成员卖价总和/中位数，不是市场价值。period_return_display 保留原串，不另转为百分比。',
    metadata: '发布与质量原始字段', date: '日期', availability: '可用性', segment: '分段', index: '指数展示串',
    return: '期间收益展示串', sum: '卖价总和（元）', median: '卖价中位数（元）', priceQuality: '价格质量', returnQuality: '收益质量',
  },
  en: {
    title: 'Native CNY index (explicit publication target)', unselected: 'No complete external publication target selected; no read is issued.',
    loading: 'Reading the selected publication target…', problem: 'The selected target is unavailable or failed validation.', retry: 'Retry the same target',
    scope: 'Scope', pins: 'Caller-supplied historical publication targets', days: 'Published days', missing: 'Missing publication dates',
    noMissing: 'No missing publication dates in this window.', disclosure: 'Decimal display strings are preserved. No FX, date filling, return calculation, chart, or inferred connections.',
    admission: 'Target matching does not authenticate rights/review or production admission. public_sha256 identifies the whole published artifact, not a recomputed hash of this scope-filtered response.',
    semantics: 'Fused member asks, not market value. period_return_display is retained as supplied, not converted to percent.',
    metadata: 'Publication and quality fields', date: 'Date', availability: 'Availability', segment: 'Segment', index: 'Index display string',
    return: 'Period return display string', sum: 'Ask sum (CNY major)', median: 'Ask median (CNY major)', priceQuality: 'Price quality', returnQuality: 'Return quality',
  },
} as const

function selectTarget(request: NativeCnyIndexRequest | null): Selection {
  if (request === null) return { key: 'UNSELECTED', target: null, invalid: false }
  try {
    const target = snapshotNativeCnyIndexRequest(request)
    return { key: JSON.stringify(target), target, invalid: false }
  } catch {
    return { key: 'INVALID_TARGET', target: null, invalid: true }
  }
}

function DayFields({ day, label }: { day: NativeCnyIndexPublicDay; label: string }) {
  const point = day.data.points[0]
  const fields: readonly (readonly [string, string | number | null])[] = [
    ['publication_id', day.publication_id], ['public_sha256', day.public_sha256],
    ['rights_sha256', day.rights_sha256], ['review_sha256', day.review_sha256], ['released_at', day.released_at],
    ['measured_at', day.data.measured_at], ['basis', day.data.basis], ['method', day.data.method],
    ['numeric_semantics', day.data.numeric_semantics], ['absolute_price_semantic', point.absolute_price_semantic],
    ['state', point.state], ['effective_estimator', point.effective_estimator],
    ['expected_member_count', point.expected_member_count], ['paired_member_count', point.paired_member_count],
    ['qualified_member_count', point.qualified_member_count], ['rejected_return_domain_count', point.rejected_return_domain_count],
    ['absolute_price_qualified_member_count', point.absolute_price_qualified_member_count],
    ...Object.entries(point.grade_counts).map(([key, value]) => [`grade_counts.${key}`, value] as const),
    ...Object.entries(point.source_pair_counts).map(([key, value]) => [`source_pair_counts.${key}`, value] as const),
    ['warnings', point.warnings.length === 0 ? '[]' : point.warnings.join(', ')],
  ]
  return (
    <details>
      <summary>{label}: {day.data.bucket_date}</summary>
      <dl>{fields.map(([name, value]) => <div key={name}><dt><code>{name}</code></dt><dd>{value === null ? nativeCnyIndexDecimalText(null) : value}</dd></div>)}</dl>
    </details>
  )
}

/** Opt-in component only: no default gateway, navigation, release discovery, or constructor fetch. */
export function NativeCnyIndexPanel({
  gateway, request, scopeLabel, lang = 'zh',
}: {
  gateway: NativeCnyIndexPanelGateway
  request: NativeCnyIndexRequest | null
  scopeLabel?: string
  lang?: 'zh' | 'en'
}) {
  const copy = COPY[lang]
  // Re-snapshot on render, including nested pins. Same-object caller mutation cannot keep an old key.
  const selection = selectTarget(request)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ReadState | null>(null)
  useEffect(() => {
    if (selection.target === null) return
    const target = selection.target
    const controller = new AbortController()
    let active = true
    const stamp = { key: selection.key, gateway, attempt }
    setState({ ...stamp, outcome: { kind: 'LOADING' } })
    void (async () => {
      try {
        const result = await gateway.read(target, { signal: controller.signal })
        if (!active || controller.signal.aborted) return
        const view = nativeCnyIndexView(result, target)
        setState({ ...stamp, outcome: { kind: 'READY', view } })
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) return
        const code = error instanceof NativeCnyIndexWireError ? error.code : 'TRANSPORT'
        setState({ ...stamp, outcome: { kind: 'PROBLEM', code } })
      }
    })()
    return () => { active = false; controller.abort() }
    // Target identity covers every snapshotted field, not caller object identity or response values.
  }, [gateway, selection.key, attempt])

  // Hide old success/error synchronously on a new target, gateway, retry, or deselection.
  const outcome = state?.key === selection.key && state.gateway === gateway && state.attempt === attempt
    ? state.outcome : { kind: 'LOADING' as const }
  const view = outcome.kind === 'READY' ? outcome.view : null
  const result = view?.result
  const problem = selection.invalid ? 'INVALID_REQUEST_TARGET'
    : outcome.kind === 'PROBLEM' ? outcome.code : result?.kind === 'ERROR' ? result.error : null

  return (
    <section className="public-market-index native-cny-index" data-testid="native-cny-index-panel" aria-label={copy.title}>
      <h2>{copy.title}</h2>
      <p>{copy.disclosure}</p><p>{copy.admission}</p>
      {selection.target !== null && selection.target.kind !== 'CURRENT' ? (
        <dl>
          <div><dt>{copy.scope}</dt><dd>{scopeLabel ? <span>{scopeLabel} · </span> : null}<code>{selection.target.scope_code}</code></dd></div>
          <div><dt>spec_sha256</dt><dd><code>{selection.target.spec_sha256}</code></dd></div>
          <div><dt>currency / price_unit / fx_applied</dt><dd>CNY / CNY_MAJOR / false</dd></div>
          {selection.target.kind === 'DAY' ? <>
            <div><dt>bucket_date</dt><dd>{selection.target.bucket_date}</dd></div>
            <div><dt>publication_id</dt><dd><code>{selection.target.publication_id}</code></dd></div>
          </> : <>
            <div><dt>start_date / end_date</dt><dd>{selection.target.start_date} / {selection.target.end_date}</dd></div>
            {selection.target.kind === 'HISTORY' ? <div><dt>{copy.pins}</dt><dd><ul>{selection.target.publication_pins.map((pin) => <li key={pin.bucket_date}>{pin.bucket_date}: <code>{pin.publication_id}</code></li>)}</ul></dd></div> : null}
          </>}
        </dl>
      ) : null}
      {!selection.invalid && selection.target === null ? <p role="status">{copy.unselected}</p> : null}
      {selection.target !== null && problem === null && outcome.kind === 'LOADING' ? <p role="status">{copy.loading}</p> : null}
      {problem !== null ? <div role="status" data-error-code={problem}>
        <p>{copy.problem} <code>{problem}</code>{result?.kind === 'ERROR' ? ` (${result.http_status})` : ''}</p>
        {selection.target !== null ? <button type="button" onClick={() => setAttempt((value) => value + 1)}>{copy.retry}</button> : null}
      </div> : null}
      {view !== null && result?.kind !== 'ERROR' && selection.target !== null ? <>
        <p>{copy.semantics}</p>
        {result?.kind === 'HISTORY' ? <>
          <h3>{copy.missing}</h3>
          {view.missingPublicationDates.length === 0 ? <p>{copy.noMissing}</p> : <ul data-testid="native-index-missing-dates">{view.missingPublicationDates.map((date) => <li key={date}>{date}</li>)}</ul>}
          <p>missing_prices_filled: false · calculation_revisions_mixed: false</p>
        </> : null}
        <h3>{copy.days} ({view.days.length})</h3>
        <div className="native-cny-index__table" role="region" aria-label={copy.days} tabIndex={0}>
          <table>
            <thead><tr>{[copy.date, copy.availability, copy.segment, copy.index, copy.return, copy.sum, copy.median, copy.priceQuality, copy.returnQuality].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{view.days.map((day) => {
              const point = day.data.points[0]
              return <tr key={`${day.data.bucket_date}:${day.publication_id}`} data-testid="native-index-day" data-date={day.data.bucket_date} data-segment={point.segment_number} data-availability={day.data.availability}>
                <th scope="row">{day.data.bucket_date}</th><td>{day.data.availability}</td><td>{point.segment_number}</td>
                <td>{nativeCnyIndexDecimalText(point.index_display)}</td><td>{nativeCnyIndexDecimalText(point.period_return_display)}</td>
                <td>{nativeCnyIndexCnyText(point.ask_sum_cny_display)}</td><td>{nativeCnyIndexCnyText(point.ask_median_cny_display)}</td>
                <td>{point.price_quality}</td><td>{point.return_quality}</td>
              </tr>
            })}</tbody>
          </table>
        </div>
        {view.days.map((day) => <DayFields key={day.publication_id + day.data.bucket_date} day={day} label={copy.metadata} />)}
      </> : null}
    </section>
  )
}
