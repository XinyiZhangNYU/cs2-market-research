import { useEffect, useMemo, useState } from 'react'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { catalogRarities } from '../catalog/catalogFacetOptions'
import { pick, useLang } from '../i18n'
import {
  simulateTradeUp,
  tradeUpInputEditionMap,
  tradeUpDecimalLabel,
  tradeUpProbabilityPercent,
  tradeUpWearLabel,
} from '../tradeup/tradeupEngine'
import {
  TradeUpError,
  type TradeUpEdition,
  type TradeUpGraphDocument,
  type TradeUpInput,
  type TradeUpSimulation,
  type TradeUpSkin,
} from '../tradeup/tradeupTypes'
import './publicTradeUp.css'
import { loadTradeUpGraph } from '../tradeup/tradeupGraphLoader'

const COPY = {
  zh: {
    eyebrow: 'TRADE UP SIMULATOR · 路径与概率',
    title: '炼金模拟器',
    intro: '10 件武器合约的可能产出、模型概率与磨损结果。',
    rulesDate: '规则数据',
    catalogDate: '目录图片',
    searchTitle: '选择投入饰品',
    search: '搜索武器或皮肤名称',
    searchPlaceholder: '搜索',
    rarity: '品质',
    rarityAll: '不限',
    noMatches: '没有匹配的可投入饰品。',
    selected: '当前选择',
    edition: '版本',
    standard: '普通',
    stattrak: 'StatTrak™',
    souvenir: '纪念品',
    float: '磨损值',
    add: '加入一件',
    fill: '填满剩余位置',
    ignoreWear: '无磨损',
    inputs: '合约投入',
    remove: '移除',
    reset: '清空',
    run: '计算合约结果',
    output: '可能产出',
    probabilityGroup: '概率组',
    probability: '单件概率',
    outputFloat: '预计磨损值',
    wear: '磨损等级',
    sourcePool: '产出池',
    resultCount: '项可能结果',
    exact: '精确分数',
    loading: '正在读取炼金规则与正式目录映射…',
    failed: '炼金规则暂时无法读取，请刷新后重试。',
    disclosureTitle: '方法与边界',
    disclosure: '本页按冻结图谱计算 10 件武器合约，不提供价格、收益率或交易建议。5 件隐秘换刀或手套的产出池及概率尚缺权威证据，暂不计算；纪念品因缺少逐款版本资格证据，暂不可选。',
    imageDisclosure: '名称与图片来自本站正式目录快照；页面不会直接请求第三方图片。',
  },
  en: {
    eyebrow: 'TRADE UP SIMULATOR · PATHS AND ODDS',
    title: 'Trade Up Simulator',
    intro: 'Possible outputs, model probabilities and resulting wear for 10-item weapon contracts.',
    rulesDate: 'Rules data',
    catalogDate: 'Catalog media',
    searchTitle: 'Choose an input',
    search: 'Search weapon or finish',
    searchPlaceholder: 'Search',
    rarity: 'Rarity',
    rarityAll: 'Any',
    noMatches: 'No eligible input matches this search.',
    selected: 'Current selection',
    edition: 'Edition',
    standard: 'Standard',
    stattrak: 'StatTrak™',
    souvenir: 'Souvenir',
    float: 'Float',
    add: 'Add one',
    fill: 'Fill remaining slots',
    ignoreWear: 'No wear',
    inputs: 'Contract inputs',
    remove: 'Remove',
    reset: 'Clear',
    run: 'Calculate outcomes',
    output: 'Possible outputs',
    probabilityGroup: 'Probability group',
    probability: 'Per-item odds',
    outputFloat: 'Estimated float',
    wear: 'Wear',
    sourcePool: 'Output pool',
    resultCount: 'possible outcomes',
    exact: 'Exact fraction',
    loading: 'Loading trade-up rules and formal catalog bindings…',
    failed: 'Trade-up rules are temporarily unavailable. Refresh to retry.',
    disclosureTitle: 'Method and limits',
    disclosure: 'This page calculates 10-item weapon contracts from a frozen graph, without prices, returns or trading advice. Five-Covert knife/glove calculations are withheld pending authoritative pool and probability evidence. Souvenir inputs are withheld pending per-finish edition evidence.',
    imageDisclosure: 'Names and images come from the formal site catalog snapshot. The page never requests third-party images directly.',
  },
} as const

const ERROR_COPY: Record<string, readonly [string, string]> = {
  INVALID_GRAPH: ['规则数据不完整，无法计算', 'Rule data is incomplete; calculation is unavailable.'],
  UNKNOWN_EDITION: ['不支持的饰品版本', 'Unsupported input edition.'],
  SOUVENIR_WITHHELD: ['纪念品资格尚未核实，暂不可用', 'Souvenir eligibility is not verified for this release.'],
  GOLD_WITHHELD: ['金色产出池及概率尚未核实，暂不计算', 'Gold pool membership and probabilities are not yet verified.'],
  WRONG_SLOT_COUNT: ['投入数量不正确', 'The contract does not have the required number of inputs.'],
  MIXED_RARITY: ['投入饰品必须为同一品质', 'All inputs must share one rarity.'],
  MIXED_EDITION: ['StatTrak™ 不能与其他版本混用', 'StatTrak™ cannot be mixed with other editions.'],
  FLOAT_OUTSIDE_PAINT: ['磨损值超出该饰品范围', 'A float is outside the selected finish range.'],
  NO_STATTRAK: ['该饰品没有 StatTrak™ 版本', 'This finish has no StatTrak™ edition.'],
  NO_GOLD_CASE: ['该隐秘饰品没有已确认的武器箱金色产出池', 'This covert input has no confirmed case gold pool.'],
  EMPTY_OUTPUT_POOL: ['没有符合版本规则的产出', 'No outputs satisfy the selected edition rules.'],
  CONTRABAND: ['违禁品质不能用于炼金模拟器', 'Contraband items cannot be used in the simulator.'],
}

type LoadState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'FAILED' }>
  | Readonly<{ status: 'READY'; graph: TradeUpGraphDocument }>

function imageSource(skin: TradeUpSkin): ItemImageSource {
  const media = skin.catalog.media
  return media.status === 'BOUND'
    ? bindItemImageUrl(catalogMediaRoute(media.media_key, media.media_asset_version_id))
    : ITEM_IMAGE_NOT_PRODUCED
}

const WEAR_SUFFIX = {
  zh: /\s*[（(](?:崭新出厂|略有磨损|久经沙场|破损不堪|战痕累累)[）)]\s*$/u,
  en: /\s*[（(](?:Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)[）)]\s*$/u,
} as const
const EDITION_MARKER = /\s*[（(](?:StatTrak(?:TM|™)|纪念品|Souvenir)[）)]/gu
const EDITION_PREFIX = /^(?:StatTrak(?:TM|™)|纪念品|Souvenir)\s+/u

function baseDisplayName(skin: TradeUpSkin, lang: 'zh' | 'en'): string {
  const name = lang === 'zh' ? skin.names.zh_cn : skin.names.en
  return name
    .replace(WEAR_SUFFIX[lang], '')
    .replace(EDITION_PREFIX, '')
    .replace(EDITION_MARKER, '')
    .replace(/\s*\|\s*/u, ' | ')
    .replace(/\s{2,}/gu, ' ')
    .trim()
}

function nameWithWear(base: string, wear: string | null): string {
  return wear === null ? base : `${base} (${wear})`
}

function inputDisplayName(skin: TradeUpSkin, input: TradeUpInput, lang: 'zh' | 'en'): string {
  if (input.float === null) return baseDisplayName(skin, lang)
  try {
    return nameWithWear(baseDisplayName(skin, lang), tradeUpWearLabel(input.float, lang))
  } catch {
    return baseDisplayName(skin, lang)
  }
}

function dateLabel(value: string, lang: 'zh' | 'en'): string {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
      }).format(date)
    : value.slice(0, 10)
}

function errorLabel(error: unknown, lang: 'zh' | 'en'): string {
  if (!(error instanceof TradeUpError)) return lang === 'zh' ? '无法计算当前合约。' : 'The contract could not be calculated.'
  const copy = ERROR_COPY[error.code]
  return copy ? copy[lang === 'zh' ? 0 : 1] : error.message
}

const TRADE_UP_RARITY_TIERS = [
  { tier: 1, id: 'CONSUMER' },
  { tier: 2, id: 'INDUSTRIAL' },
  { tier: 3, id: 'MIL_SPEC' },
  { tier: 4, id: 'RESTRICTED' },
  { tier: 5, id: 'CLASSIFIED' },
] as const

function rarityLabel(tier: number, lang: 'zh' | 'en'): string {
  const mapped = TRADE_UP_RARITY_TIERS.find((entry) => entry.tier === tier)
  const option = catalogRarities.find((entry) => entry.id === mapped?.id)
  return option ? pick(option.name, lang) : String(tier)
}

function probabilityGroups(simulation: TradeUpSimulation): readonly (readonly [string, readonly TradeUpSimulation['outcomes'][number][]])[] {
  const groups = new Map<string, TradeUpSimulation['outcomes'][number][]>()
  simulation.outcomes.forEach((outcome) => {
    const current = groups.get(outcome.probability_text) ?? []
    current.push(outcome)
    groups.set(outcome.probability_text, current)
  })
  return [...groups.entries()]
}

export function PublicTradeUpPage() {
  const lang = useLang()
  const copy = COPY[lang]
  const [load, setLoad] = useState<LoadState>({ status: 'LOADING' })
  const [query, setQuery] = useState('')
  const [rarityTier, setRarityTier] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [edition, setEdition] = useState<TradeUpEdition>('standard')
  const [floatValue, setFloatValue] = useState('0.10')
  const [ignoreWear, setIgnoreWear] = useState(false)
  const [inputs, setInputs] = useState<readonly TradeUpInput[]>([])
  const [simulation, setSimulation] = useState<TradeUpSimulation | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadTradeUpGraph(controller.signal)
      .then((graph) => {
        if (!controller.signal.aborted) setLoad({ status: 'READY', graph })
      })
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') setLoad({ status: 'FAILED' })
      })
    return () => controller.abort()
  }, [])

  const skinById = useMemo(
    () => new Map(load.status === 'READY' ? load.graph.skins.map((skin) => [skin.id, skin]) : []),
    [load],
  )
  const selected = selectedId === null ? null : skinById.get(selectedId) ?? null
  const firstInputSkin = inputs[0] ? skinById.get(inputs[0].id) ?? null : null
  const eligibleEditions = useMemo(() => load.status === 'READY'
    ? tradeUpInputEditionMap(load.graph) : new Map<string, readonly ('standard' | 'stattrak')[]>(), [load])
  const contractEdition = inputs[0]?.edition ?? null
  const selectionEditions = (selected ? eligibleEditions.get(selected.id) ?? [] : [])
    .filter((value) => contractEdition === null || value === contractEdition)
  const matches = useMemo(() => {
    if (load.status !== 'READY') return []
    const term = query.normalize('NFKC').toLocaleLowerCase(lang === 'zh' ? 'zh-CN' : 'en-US').trim()
    if (term.length < 2 && rarityTier === null) return []
    return load.graph.skins.filter((skin) =>
      (eligibleEditions.get(skin.id) ?? []).some((value) => contractEdition === null || value === contractEdition) &&
      (rarityTier === null || skin.rarity_tier === rarityTier) &&
      (firstInputSkin === null || skin.rarity_tier === firstInputSkin.rarity_tier) &&
      (term.length < 2 || `${skin.names.zh_cn}\n${skin.names.en}`.normalize('NFKC').toLocaleLowerCase().includes(term))
    )
  }, [contractEdition, eligibleEditions, firstInputSkin, lang, load, query, rarityTier])

  const selectSkin = (skin: TradeUpSkin) => {
    setSelectedId(skin.id)
    setQuery('')
    setFloatValue(skin.float_min)
    const allowed = (eligibleEditions.get(skin.id) ?? []).filter((value) => contractEdition === null || value === contractEdition)
    setEdition(allowed.includes(edition as 'standard' | 'stattrak') ? edition : allowed[0] ?? 'standard')
    setProblem(null)
  }

  const addInputs = (fill: boolean) => {
    if (!selected || !selectionEditions.includes(edition as 'standard' | 'stattrak')) return
    const slots = 10
    const count = fill ? Math.max(0, slots - inputs.length) : 1
    if (count === 0 || inputs.length + count > slots) return
    const value = ignoreWear ? null : floatValue
    const additions = Array.from({ length: count }, () => ({ id: selected.id, float: value, edition }))
    setInputs((current) => [...current, ...additions])
    setSimulation(null)
    setProblem(null)
  }

  const run = () => {
    if (load.status !== 'READY') return
    try {
      setSimulation(simulateTradeUp(load.graph, inputs))
      setProblem(null)
    } catch (error) {
      setSimulation(null)
      setProblem(errorLabel(error, lang))
    }
  }

  if (load.status !== 'READY') {
    return <section className="public-tradeup public-result-page"><div className="public-tradeup__loading" role="status">{load.status === 'LOADING' ? copy.loading : copy.failed}</div></section>
  }

  const slots = 10
  const grouped = simulation ? probabilityGroups(simulation) : []

  return (
    <article className="public-tradeup public-result-page">
      <header className="public-result-page__header">
        <div>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <dl className="public-tradeup__clocks">
          <div><dt>{copy.rulesDate}</dt><dd>{dateLabel(load.graph.source.rules_as_of, lang)}</dd></div>
          <div><dt>{copy.catalogDate}</dt><dd>{dateLabel(load.graph.source.catalog_as_of, lang)}</dd></div>
        </dl>
      </header>

      <section className="public-tradeup__builder" aria-labelledby="tradeup-builder-title">
        <div className="public-tradeup__section-heading">
          <div><span>01</span><h2 id="tradeup-builder-title">{copy.searchTitle}</h2></div>
        </div>
        <div className="public-tradeup__search">
          <div className="public-tradeup__filters">
            <label>
              <span>{copy.search}</span>
              <input value={query} placeholder={copy.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label>
              <span>{copy.rarity}</span>
              <select
                data-testid="tradeup-rarity-filter"
                value={rarityTier ?? ''}
                onChange={(event) => setRarityTier(event.target.value === '' ? null : Number(event.target.value))}
              >
                <option value="">{copy.rarityAll}</option>
                {TRADE_UP_RARITY_TIERS.map((entry) => (
                  <option key={entry.tier} value={entry.tier}>{rarityLabel(entry.tier, lang)}</option>
                ))}
              </select>
            </label>
          </div>
          {query.trim().length >= 2 || rarityTier !== null ? (
            <div className="public-tradeup__matches" role="listbox">
              {matches.length === 0 ? <p>{copy.noMatches}</p> : matches.map((skin) => (
                <button key={skin.id} type="button" role="option" aria-selected={selectedId === skin.id} onClick={() => selectSkin(skin)}>
                  <ItemImageSlot source={imageSource(skin)} label={baseDisplayName(skin, lang)} variant="thumbnail" presentation="PRODUCT" testId={`tradeup-search-${skin.catalog.analysis_unit_id ?? skin.id}`} />
                  <span><strong>{baseDisplayName(skin, lang)}</strong><small>{rarityLabel(skin.rarity_tier, lang)} · {skin.collection ?? skin.cases[0] ?? '—'}</small></span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="public-tradeup__selection">
            <ItemImageSlot source={imageSource(selected)} label={baseDisplayName(selected, lang)} variant="thumbnail" presentation="PRODUCT" testId="tradeup-selected-image" />
            <div className="public-tradeup__selection-copy"><span>{copy.selected}</span><strong>{baseDisplayName(selected, lang)}</strong><small>{selected.collection ?? selected.cases[0] ?? '—'}</small></div>
            <label><span>{copy.edition}</span><select value={edition} onChange={(event) => setEdition(event.target.value as TradeUpEdition)}>{selectionEditions.map((value) => <option key={value} value={value}>{value === 'stattrak' ? copy.stattrak : copy.standard}</option>)}</select></label>
            {!ignoreWear ? <label><span>{copy.float}</span><input inputMode="decimal" value={floatValue} min={selected.float_min} max={selected.float_max} onChange={(event) => setFloatValue(event.target.value)} /></label> : null}
            <div className="public-tradeup__selection-actions"><button type="button" onClick={() => addInputs(false)}>{copy.add}</button><button type="button" onClick={() => addInputs(true)}>{copy.fill}</button></div>
          </div>
        ) : null}

        <div className="public-tradeup__options">
          <label><input type="checkbox" checked={ignoreWear} onChange={(event) => {
            const checked = event.target.checked
            setIgnoreWear(checked)
            setInputs((current) => current.map((input) => ({
              ...input,
              float: checked ? null : skinById.get(input.id)?.float_min ?? '0',
            })))
            if (!checked && selected) setFloatValue(selected.float_min)
            setSimulation(null)
          }} /> <span>{copy.ignoreWear}</span></label>
        </div>
      </section>

      <section className="public-tradeup__inputs" aria-labelledby="tradeup-inputs-title">
        <div className="public-tradeup__section-heading"><div><span>02</span><h2 id="tradeup-inputs-title">{copy.inputs}</h2></div>{inputs.length > 0 ? <button type="button" onClick={() => { setInputs([]); setSimulation(null); setProblem(null) }}>{copy.reset}</button> : null}</div>
        {inputs.length > 0 ? (
          <ol>{inputs.map((input, index) => { const skin = skinById.get(input.id)!; const name = inputDisplayName(skin, input, lang); return <li key={`${input.id}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><small>{input.edition === 'stattrak' ? copy.stattrak : input.edition === 'souvenir' ? copy.souvenir : copy.standard}</small>{!ignoreWear && input.float !== null ? <code>{tradeUpDecimalLabel(input.float, 6)}</code> : null}<button type="button" aria-label={`${copy.remove} ${name}`} onClick={() => { setInputs((current) => current.filter((_row, rowIndex) => rowIndex !== index)); setSimulation(null) }}>×</button></li> })}</ol>
        ) : null}
        <div className="public-tradeup__run"><button type="button" disabled={inputs.length !== slots} onClick={run}>{copy.run}<span aria-hidden="true">→</span></button>{problem ? <p role="alert">{problem}</p> : null}</div>
      </section>

      {simulation ? (
        <section className="public-tradeup__results" aria-labelledby="tradeup-results-title">
          <div className="public-tradeup__section-heading"><div><span>03</span><h2 id="tradeup-results-title">{copy.output}</h2></div><strong>{simulation.outcomes.length} {copy.resultCount}</strong></div>
          <div className="public-tradeup__result-summary"><span>{copy.sourcePool}</span><strong>{simulation.groups.map((group) => `${lang === 'zh' ? load.graph.labels_zh.collections[group.name] ?? load.graph.labels_zh.cases[group.name] ?? group.name : group.name} · ${group.inputs}/${simulation.slots}`).join(' / ')}</strong></div>
          {grouped.map(([fraction, outcomes]) => outcomes ? (
            <section className="public-tradeup__probability-group" key={fraction}>
              <header><div><span>{copy.probabilityGroup}</span><strong>{tradeUpProbabilityPercent(outcomes[0].probability)}</strong></div><p>{copy.exact} {fraction} · {outcomes.length} {copy.resultCount}</p></header>
              <ul>{outcomes.map((outcome) => <li key={outcome.skin.id}>
                <ItemImageSlot source={imageSource(outcome.skin)} label={nameWithWear(baseDisplayName(outcome.skin, lang), lang === 'zh' ? outcome.wear_zh : outcome.wear_en)} variant="thumbnail" presentation="PRODUCT" testId={`tradeup-result-${outcome.skin.catalog.analysis_unit_id ?? outcome.skin.id}`} />
                <div><strong>{nameWithWear(baseDisplayName(outcome.skin, lang), lang === 'zh' ? outcome.wear_zh : outcome.wear_en)}</strong><small>{lang === 'zh' ? outcome.group_zh ?? outcome.group : outcome.group}</small></div>
                <dl><div><dt>{copy.probability}</dt><dd>{tradeUpProbabilityPercent(outcome.probability)}</dd></div>{!ignoreWear && outcome.output_float !== null ? <><div><dt>{copy.outputFloat}</dt><dd>{tradeUpDecimalLabel(outcome.output_float, 6)}</dd></div><div><dt>{copy.wear}</dt><dd>{lang === 'zh' ? outcome.wear_zh : outcome.wear_en}</dd></div></> : null}</dl>
              </li>)}</ul>
            </section>
          ) : null)}
        </section>
      ) : null}

      <aside className="public-tradeup__disclosure"><strong>{copy.disclosureTitle}</strong><p>{copy.disclosure}</p><p>{copy.imageDisclosure}</p></aside>
    </article>
  )
}
