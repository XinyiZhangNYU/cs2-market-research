import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { nativeCnySingleDetailView, nativeCnySingleProblem } from '../adapter/nativeCnySingleViewModel'
import type { NativeCnySingleDetailGateway, NativeCnySingleDetailView, NativeCnySingleProblemCode } from '../adapter/nativeCnySingleViewModel'
import { checkedNativeCnySingleBinding } from '../wire/nativeCnySingleDecode'
import type { NativeCnySingleBinding } from '../wire/nativeCnySingleDecode'

type Choice = { kind: 'UNSELECTED'; key: string }
  | { kind: 'INVALID'; key: string }
  | { kind: 'SELECTED'; key: string; binding: NativeCnySingleBinding }
type Outcome = { kind: 'READY'; view: NativeCnySingleDetailView }
  | { kind: 'PROBLEM'; code: NativeCnySingleProblemCode }

const PROBLEM_TEXT: Record<NativeCnySingleProblemCode, string> = {
  INVALID_SELECTION: '选择无效：必须显式提供完整 item、publication、public、rights、review、catalog 和 day pins。',
  INVALID_GATEWAY: '未提供明确的原生 CNY 单品 Gateway。',
  VALIDATION_ERROR: '响应未通过所选身份、publication pins 或单品合同校验。',
  INVALID_REQUEST: '所选单品请求无效（INVALID_REQUEST）。',
  NOT_PUBLISHED: '所选 publication 未发布该单品的 observed-trigger 详情（NOT_PUBLISHED）；不推断信号为 FALSE。',
  TEMPORARILY_UNAVAILABLE: '单品详情暂不可用（TEMPORARILY_UNAVAILABLE）。',
  REQUEST_TIMEOUT: '单品详情请求超时（REQUEST_TIMEOUT）。',
  NETWORK_UNAVAILABLE: '单品详情请求失败（NETWORK_UNAVAILABLE）。',
  CANCELLED: '已取消单品详情请求；未加载替代数据。',
}

function choiceFor(selection: NativeCnySingleBinding | null): Choice {
  if (selection === null) return { kind: 'UNSELECTED', key: 'UNSELECTED' }
  try {
    const binding = checkedNativeCnySingleBinding(selection)
    return { kind: 'SELECTED', key: JSON.stringify([binding.itemId, binding.publicationId,
      binding.publicSha256, binding.rightsSha256, binding.reviewSha256, binding.catalogPublicationId, binding.day]), binding }
  } catch { return { kind: 'INVALID', key: 'INVALID_SELECTION' } }
}

function Detail({ view }: { view: NativeCnySingleDetailView }) {
  const day = view.publication.data
  return <>
    <dl>
      <div><dt>Item（原始 int64 文本）</dt><dd><code>{view.selection.itemId}</code></dd></div>
      <div><dt>分析单元</dt><dd><code>{view.feature.analysis_unit_id}</code></dd></div>
      <div><dt>所选 day</dt><dd><time dateTime={day.day}>{day.day}</time></dd></div>
      <div><dt>方法</dt><dd><code>{day.method}</code> · HH55/X3</dd></div>
      <div><dt>币种 / FX</dt><dd>{day.currency} · fx_applied=false（无 FX）</dd></div>
      <div><dt>价格</dt><dd>本详情未发布价格；CNY 标签不代表已有报价。</dd></div>
      <div><dt>排行 / 阶段</dt><dd>NO_RANK · stage=null（不是旧状态榜或完整阶段评估）</dd></div>
      <div><dt>知识模式</dt><dd><code>{day.knowledge_mode}</code>（回溯、迟绑定）</dd></div>
      <div><dt>前瞻验证信用</dt><dd>prospective_validation_credit=false（无前瞻信用）</dd></div>
      <div><dt>日来源</dt><dd><code>{day.daily_origin}</code></dd></div>
    </dl>
    <h3>逐族 signal / disposition / observed trigger</h3>
    <ul>
      {view.families.map((row) => <li key={row.family} data-family={row.family}>
        <h4><code>{row.family}</code></h4>
        <p>signal=<code>{row.signal}</code> · disposition=<code>{row.disposition}</code></p>
        {row.trigger === null
          ? <p>本族未发布触发；不等于信号为 FALSE。</p>
          : <dl>
            <div><dt>触发 ID</dt><dd><code>{row.trigger.trigger_id}</code></dd></div>
            <div><dt>触发类型</dt><dd><code>{row.trigger.entry_kind}</code></dd></div>
            <div><dt>Onset day</dt><dd><time dateTime={row.trigger.onset_day}>{row.trigger.onset_day}</time></dd></div>
            <div><dt>触发 computed_at</dt><dd><code>{row.trigger.computed_at}</code></dd></div>
            <div><dt>触发 first_available_at</dt><dd><code>{row.trigger.first_available_at}</code></dd></div>
            <div><dt>触发知识模式</dt><dd><code>{row.trigger.knowledge_mode}</code></dd></div>
            <div><dt>公开标签</dt><dd>{row.trigger.public_label ?? '未发布标签（null）'}</dd></div>
          </dl>}
      </li>)}
    </ul>
    <details>
      <summary>资格、精确时钟与完整选择 pins</summary>
      <dl>
        <div><dt>history_state</dt><dd><code>{view.feature.history_state}</code></dd></div>
        <div><dt>baseline_month / qualified_baseline_days</dt><dd>{view.feature.baseline_month} / {view.feature.qualified_baseline_days}</dd></div>
        <div><dt>current_qualified / recent_complete / reference_complete</dt><dd>
          {String(view.feature.current_qualified)} / {String(view.feature.recent_complete)} / {String(view.feature.reference_complete)}
        </dd></div>
        <div><dt>released_at</dt><dd><code>{view.publication.released_at}</code></dd></div>
        <div><dt>computed_at</dt><dd><code>{day.computed_at}</code></dd></div>
        <div><dt>first_available_at（day）</dt><dd><code>{day.first_available_at}</code></dd></div>
        <div><dt>first_available_at（feature）</dt><dd><code>{view.feature.first_available_at}</code></dd></div>
        {Object.entries(view.selection).map(([name, value]) => <div key={name}><dt>{name}</dt><dd><code>{value}</code></dd></div>)}
        <div><dt>protocol_sha256</dt><dd><code>{day.protocol_sha256}</code></dd></div>
        <div><dt>hourly_policy</dt><dd><code>{day.hourly_policy}</code></dd></div>
        <div><dt>basis</dt><dd><code>{day.basis}</code></dd></div>
      </dl>
      <p>publicSha256 绑定原始发布整日包，不是此过滤详情的 hash。pins 校验不认证 rights 真实性或生产准入。</p>
    </details>
  </>
}

/** Opt-in only: nothing requests unless the caller supplies a complete explicit selection. */
export function NativeCnySingleDetailPanel({ gateway, selection }: {
  gateway: NativeCnySingleDetailGateway
  selection: NativeCnySingleBinding | null
}) {
  // Snapshot all seven fields on each render. Equal values do not create a new read.
  const choice = choiceFor(selection)
  const scope = useMemo(() => ({}), [gateway, choice.key])
  const currentScope = useRef(scope)
  // A speculative concurrent render can be suspended or abandoned. Only a
  // committed target may retire the currently committed request's completion.
  // Layout timing also fences old callbacks before the passive-effect cleanup.
  useLayoutEffect(() => { currentScope.current = scope }, [scope])
  const activeRequest = useRef<{ scope: object; controller: AbortController } | null>(null)
  const [read, setRead] = useState<{ scope: object; outcome: Outcome } | null>(null)
  const outcome = read?.scope === scope ? read.outcome : null

  useEffect(() => {
    if (choice.kind !== 'SELECTED') return
    if (!gateway || gateway.kind !== 'HTTP_NATIVE_CNY_SINGLE' || typeof gateway.read !== 'function') {
      setRead({ scope, outcome: { kind: 'PROBLEM', code: 'INVALID_GATEWAY' } })
      return
    }
    const controller = new AbortController()
    let mounted = true
    activeRequest.current = { scope, controller }
    const isCurrent = () => mounted && currentScope.current === scope && !controller.signal.aborted
    const load = async () => {
      try {
        const document = await gateway.read(choice.binding, { signal: controller.signal })
        if (!isCurrent()) return
        const view = nativeCnySingleDetailView(document, choice.binding)
        if (isCurrent()) setRead({ scope, outcome: { kind: 'READY', view } })
      } catch (error: unknown) {
        if (isCurrent()) setRead({ scope, outcome: { kind: 'PROBLEM', code: nativeCnySingleProblem(error) } })
      }
    }
    void load()
    return () => {
      mounted = false
      controller.abort()
      if (activeRequest.current?.scope === scope) activeRequest.current = null
    }
    // The full primitive key fixes the binding snapshot without depending on caller object allocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, scope])

  const state = choice.kind === 'UNSELECTED' ? 'UNSELECTED' : choice.kind === 'INVALID' ? 'INVALID_SELECTION'
    : outcome === null ? 'LOADING' : outcome.kind === 'READY' ? 'READY' : outcome.code
  const cancel = () => {
    const request = activeRequest.current
    if (request?.scope !== scope) return
    request.controller.abort()
    setRead({ scope, outcome: { kind: 'PROBLEM', code: 'CANCELLED' } })
  }
  return <section aria-label="原生 CNY 单品 observed-trigger 详情" aria-busy={state === 'LOADING'}
    data-testid="native-cny-single-detail" data-single-state={state} style={{ overflowWrap: 'anywhere' }}>
    <h2>原生 CNY 单品 observed-trigger 详情</h2>
    <p role="status">{state === 'UNSELECTED' ? '未选择完整 publication/单品 pins；未发起请求。'
      : state === 'LOADING' ? '正在读取显式所选单品详情…'
      : state === 'READY' ? '所选单品详情已加载。' : PROBLEM_TEXT[state]}</p>
    {state === 'LOADING' ? <button type="button" onClick={cancel}>取消单品请求</button> : null}
    {choice.kind === 'SELECTED' && outcome?.kind === 'READY' ? <Detail view={outcome.view} /> : null}
  </section>
}
