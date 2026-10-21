import { useMemo, useState, type MouseEventHandler } from 'react'
import releasedHistory from '../data/valveAnalysisHistory.public.json'
import { useLang } from '../i18n'
import { valvePublicLabel } from './valvePublicLabels'
import './publicValve.css'

type ArticleText = { title: string; body: string }
type BilingualArticle = { zh_cn: ArticleText; en: ArticleText }
type Analysis = { facts: string; mechanisms: string; conclusion: string; limitations: string[] } | ArticleText | BilingualArticle
type LocalizedText = { zh_cn: string; en: string }
type LocalizedTexts = { zh_cn: string[]; en: string[] }
type Label = { subject: string | LocalizedText; direction: string; mechanism: string | LocalizedText;
  conditions: string[] | LocalizedTexts; counterexamples: string[] | LocalizedTexts; basis: string }
type Comment = { author: 'USER'; commented_at: string; text: string; feedback: string }
type Version = { version: number; revision_id: string; recorded_at: string; analyzed_at: string;
  information_cutoff_at: string; author: string; quality: string; status: string;
  analysis: Analysis | null; labels: Label[]; comments: Comment[] }
type Case = { event_id: string; title: string; official_published_at: string; official_url: string;
  updated_at: string; withdrawn: boolean; versions: Version[] }
export type PublicHistory = { schema_id: string; as_of: string; release_id: string; cases: Case[] }

function fields(value: unknown, names: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== names.split(' ').sort().join(',')) throw new Error('Invalid history fields')
}
function str(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid history text')
}
function date(value: unknown) {
  str(value)
  if (!value.endsWith('Z') || !Number.isFinite(Date.parse(value))) throw new Error('Invalid history time')
}
function hex(value: unknown) {
  str(value)
  if (!/^[0-9a-f]{64}$/u.test(value)) throw new Error('Invalid history identity')
}
function arr(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Invalid history list')
}
function texts(value: unknown) { arr(value); value.forEach(str) }
function one(value: unknown, values: string[]) {
  if (typeof value !== 'string' || !values.includes(value)) throw new Error('Invalid history status')
}

export function parsePublicHistory(value: unknown): PublicHistory {
  fields(value, 'schema_id as_of release_id cases')
  if (!['valve-analysis-history-public/v1', 'valve-analysis-history-public/v2', 'valve-analysis-history-public/v3'].includes(String(value.schema_id))) throw new Error('Invalid history contract')
  date(value.as_of); hex(value.release_id); arr(value.cases)
  const seen = new Set<string>()
  for (const entry of value.cases) {
    fields(entry, 'event_id title official_published_at official_url updated_at withdrawn versions')
    hex(entry.event_id); str(entry.title); date(entry.official_published_at); date(entry.updated_at); str(entry.official_url)
    const url = new URL(entry.official_url)
    if (url.protocol !== 'https:' || url.username || url.password || !['www.counter-strike.net', 'store.steampowered.com', 'steamcommunity.com', 'steamstore-a.akamaihd.net'].includes(url.hostname)) throw new Error('Invalid official link')
    if (typeof entry.withdrawn !== 'boolean' || seen.has(String(entry.event_id))) throw new Error('Invalid history case')
    seen.add(String(entry.event_id)); arr(entry.versions)
    if (!entry.versions.length) throw new Error('History has no versions')
    for (const [index, version] of entry.versions.entries()) {
      fields(version, 'version revision_id recorded_at analyzed_at information_cutoff_at author quality status analysis labels comments')
      if (version.version !== index + 1) throw new Error('History version gap')
      hex(version.revision_id); date(version.recorded_at); date(version.analyzed_at); date(version.information_cutoff_at)
      if (Date.parse(String(version.information_cutoff_at)) > Date.parse(String(version.analyzed_at)) || Date.parse(String(version.analyzed_at)) > Date.parse(String(version.recorded_at)) || Date.parse(String(version.recorded_at)) > Date.parse(String(value.as_of))) throw new Error('Inconsistent history clock')
      one(version.author, ['MODEL','ASSISTANT_SYNTHESIS','USER'])
      one(version.quality, ['UNREVIEWED','NEEDS_CORRECTION','CURATED'])
      one(version.status, ['AWAITING_REVIEW','PUBLIC','WITHDRAWN'])
      arr(version.labels); arr(version.comments)
      if (version.status !== 'PUBLIC' && (version.analysis !== null || version.labels.length)) throw new Error('Private analysis in public history')
      if (entry.withdrawn !== (version.status === 'WITHDRAWN') || (entry.withdrawn && version.comments.length)) throw new Error('Withdrawn history has content')
      if (version.status === 'PUBLIC') {
        if (version.analysis && typeof version.analysis === 'object' && 'zh_cn' in version.analysis) {
          if (value.schema_id !== 'valve-analysis-history-public/v3') throw new Error('Bilingual article under legacy history contract')
          const analysis: unknown = version.analysis
          fields(analysis, 'zh_cn en')
          for (const locale of ['zh_cn', 'en'] as const) {
            fields(analysis[locale], 'title body')
            str(analysis[locale].title); str(analysis[locale].body)
          }
        } else if (version.analysis && typeof version.analysis === 'object' && 'body' in version.analysis) {
          if (value.schema_id === 'valve-analysis-history-public/v1') throw new Error('Reader article under legacy history contract')
          const analysis: unknown = version.analysis
          fields(analysis, 'title body')
          str(analysis.title); str(analysis.body)
        } else {
          fields(version.analysis, 'facts mechanisms conclusion limitations')
          str(version.analysis.facts); str(version.analysis.mechanisms); str(version.analysis.conclusion); texts(version.analysis.limitations)
        }
      }
      for (const label of version.labels) {
        fields(label, 'subject direction mechanism conditions counterexamples basis')
        if (label.subject && typeof label.subject === 'object') {
          fields(label.subject, 'zh_cn en'); str(label.subject.zh_cn); str(label.subject.en)
          fields(label.mechanism, 'zh_cn en'); str(label.mechanism.zh_cn); str(label.mechanism.en)
          fields(label.conditions, 'zh_cn en'); texts(label.conditions.zh_cn); texts(label.conditions.en)
          fields(label.counterexamples, 'zh_cn en'); texts(label.counterexamples.zh_cn); texts(label.counterexamples.en)
        } else {
          str(label.subject); str(label.mechanism); texts(label.conditions); texts(label.counterexamples)
        }
        one(label.direction, ['POSITIVE','NEGATIVE','MIXED','UNCERTAIN','NO_CLEAR_IMPACT'])
        one(label.basis, ['ASSISTANT_PROVISIONAL','USER_DERIVED'])
      }
      for (const comment of version.comments) {
        fields(comment, 'author commented_at text feedback')
        if (comment.author !== 'USER') throw new Error('Invalid comment attribution')
        date(comment.commented_at); str(comment.text); one(comment.feedback, ['CORRECTION','CALIBRATION','AGREEMENT'])
        if (Date.parse(String(comment.commented_at)) > Date.parse(String(version.recorded_at))) throw new Error('Future comment')
      }
    }
  }
  return value as unknown as PublicHistory
}

function Time({ value }: { value: string }) {
  return <time dateTime={value}>{value.slice(0, 16).replace('T', ' ')} UTC</time>
}

function authorLabel(author: string, zh: boolean) {
  if (author === 'MODEL') return zh ? 'AI 原稿' : 'AI draft'
  if (author === 'USER') return zh ? '站长分析' : 'Curator analysis'
  return zh ? '分析整理稿' : 'Editorial analysis'
}

function articleFor(analysis: Analysis, zh: boolean): ArticleText | null {
  if ('zh_cn' in analysis) return analysis[zh ? 'zh_cn' : 'en']
  if ('body' in analysis) return analysis
  return null
}

function textFor(value: string | LocalizedText, zh: boolean): string {
  return typeof value === 'string' ? value : value[zh ? 'zh_cn' : 'en']
}

function textsFor(value: string[] | LocalizedTexts, zh: boolean): string[] {
  return Array.isArray(value) ? value : value[zh ? 'zh_cn' : 'en']
}

function HistoryCase({ entry }: { entry: Case }) {
  const lang = useLang()
  const zh = lang === 'zh'
  const [versionId, setVersionId] = useState(entry.versions.at(-1)!.revision_id)
  const version = entry.versions.find(v => v.revision_id === versionId) ?? entry.versions.at(-1)!
  const readerArticle = version.analysis ? articleFor(version.analysis, zh) : null
  const legacyAnalysis = version.analysis && 'facts' in version.analysis ? version.analysis : null
  const hasCorrection = version.quality === 'NEEDS_CORRECTION' || entry.versions.some(v =>
    v.version > version.version && v.quality === 'NEEDS_CORRECTION' &&
    v.analyzed_at === version.analyzed_at && v.author === version.author)
  return <article className="valve-history__case" data-testid="valve-history-case">
    <header><div><p>{zh ? '官方公告发布' : 'Official announcement'} · <Time value={entry.official_published_at} /></p><h3>{entry.title}</h3></div>
      <span className="valve-history__badge">{entry.withdrawn ? (zh ? '已撤回' : 'Withdrawn') : (zh ? '事后分析记录' : 'Retrospective record')}</span></header>
    <div className="valve-history__times">
      <p>{zh ? '分析时间' : 'Analyzed'}：<Time value={version.analyzed_at} /></p>
      <p>{zh ? '参考资料截至' : 'Information through'}：<Time value={version.information_cutoff_at} /></p>
    </div>
    <label className="valve-history__version">{zh ? '分析版本' : 'Analysis version'}
      <select aria-label={`${entry.title} ${zh ? '分析版本' : 'analysis version'}`} value={version.revision_id} onChange={e => setVersionId(e.target.value)}>
        {[...entry.versions].reverse().map(v => <option key={v.revision_id} value={v.revision_id}>v{v.version} · {v.analyzed_at.slice(0,16).replace('T',' ')} UTC · {authorLabel(v.author,zh)}</option>)}
      </select>
    </label>
    {!entry.withdrawn && <p className="valve-history__muted" data-testid="history-version-status">
      {authorLabel(version.author,zh)} · {hasCorrection
        ? (zh ? '已有纠正意见，请勿直接沿用旧结论' : 'Corrections recorded; do not reuse this conclusion without review')
        : version.status === 'PUBLIC' ? (zh ? '正文已公开' : 'Analysis published') : (zh ? '正文待审' : 'Analysis awaiting review')}
    </p>}
    {version.analysis ? <section className="valve-history__analysis" data-testid="history-analysis-body">
      {readerArticle ? <>
        <h4>{readerArticle.title}</h4>
        {readerArticle.body.split(/\n\s*\n/u).map((paragraph,index) => <p key={index}>{paragraph}</p>)}
      </> : legacyAnalysis ? <>
      <h4>{zh ? '基于资料的分析' : 'Evidence-based analysis'}</h4>
      <p><strong>{zh ? '公告事实' : 'Announcement facts'}：</strong>{legacyAnalysis.facts}</p>
      <p><strong>{zh ? '影响机制' : 'Mechanisms'}：</strong>{legacyAnalysis.mechanisms}</p>
      <p><strong>{zh ? '判断' : 'Assessment'}：</strong>{legacyAnalysis.conclusion}</p>
      <ul>{legacyAnalysis.limitations.map(item => <li key={item}>{item}</li>)}</ul>
      </> : null}
      <div>{version.labels.map(label => <section className="valve-history__label" key={textFor(label.subject,zh)}>
        <h4>{textFor(label.subject,zh)} · {valvePublicLabel(label.direction,lang)}</h4><p>{textFor(label.mechanism,zh)}</p>
        <p>{zh ? '适用条件' : 'Conditions'}：{textsFor(label.conditions,zh).join(zh ? '；' : '; ')}</p>
        <p>{zh ? '反例' : 'Counterexamples'}：{textsFor(label.counterexamples,zh).join(zh ? '；' : '; ')}</p>
        <small>{label.basis === 'USER_DERIVED' ? (zh ? '依据站长点评整理的标签' : 'Labels derived from curator comments') : (zh ? '分析者暂拟标签' : 'Provisional analyst labels')}</small>
      </section>)}</div>
    </section> : <p className="valve-history__pending">{entry.withdrawn ? (zh ? '该案例已撤回，历史正文与点评不再展示。' : 'This case was withdrawn. Previous text and comments are no longer displayed.') : (zh ? '分析正文待审，暂未公开；下方点评单独保留。' : 'Analysis text is pending review. Curator comments are maintained separately below.')}</p>}
    {version.comments.map((comment,index) => <section className="valve-history__comment" key={`${comment.commented_at}-${index}`}>
      <h4>{zh ? '站长点评' : 'Curator comment'} · <Time value={comment.commented_at} /></h4>
      {Date.parse(comment.commented_at) < Date.parse(version.analyzed_at) ? <p className="valve-history__muted">{zh ? '这条点评早于本版分析，是分析参考，不表示站长已认可本版结论。' : 'This comment predates this analysis. It is an input, not an endorsement of this version.'}</p> : null}
      <p>{comment.text}</p>
    </section>)}
    {!entry.withdrawn && !version.comments.length ? <p className="valve-history__muted">{
      entry.versions.some(v => v.version > version.version && v.comments.length)
        ? (zh ? '本版尚未收到站长点评；后续版本已收录点评。' : 'This version predates the curator comments recorded in later versions.')
        : (zh ? '尚无本条公告的站长点评。' : 'No curator comment for this announcement yet.')
    }</p> : null}
    <footer><a href={entry.official_url} rel="noreferrer">{zh ? '查看官方原文' : 'Read the official announcement'}</a><span>{zh ? '归档更新' : 'Archive updated'} · <Time value={entry.updated_at} /></span></footer>
  </article>
}

export function ValveAnalysisHistory({
  document = releasedHistory,
  announcementsHref = '/valve',
  onAnnouncementsClick,
}: {
  document?: unknown
  announcementsHref?: string
  onAnnouncementsClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  const lang = useLang()
  const zh = lang === 'zh'
  const [query, setQuery] = useState('')
  const parsed = useMemo(() => { try { return parsePublicHistory(document) } catch { return null } },[document])
  if (!parsed) return <p role="alert">{zh ? '历史分析暂不可用，请稍后再试。' : 'Analysis history is temporarily unavailable.'}</p>
  const needle = query.trim().toLocaleLowerCase()
  const cases = parsed.cases.filter(entry => {
    const localizedArticles = entry.versions.flatMap(version => {
      if (!version.analysis) return []
      const article = articleFor(version.analysis, zh)
      return article ? [article.title, article.body] : []
    })
    return [entry.title, ...localizedArticles].some(text => text.toLocaleLowerCase().includes(needle))
  })
  return <section className="valve-history" data-testid="valve-analysis-history">
    <nav className="public-valve-switcher" aria-label={zh ? 'Valve 公告视图' : 'Valve announcement views'}>
      <a href={announcementsHref} onClick={onAnnouncementsClick}>{zh ? '最新公告' : 'Latest announcements'}</a>
      <span aria-current="page">{zh ? '历史分析' : 'Analysis history'}</span>
    </nav>
    <header><p>{zh ? '案例、点评与修订' : 'Cases, comments and revisions'}</p><h2>{zh ? '历史公告分析' : 'Announcement analysis history'}</h2>
      <p>{zh ? '保留每次分析的时间与后续纠正。历史观点可供比较，不等于已经验证的市场结果。' : 'Dated analyses and subsequent corrections. Historical views support comparison; they are not verified market outcomes.'}</p>
      <p>{zh ? `已建档 ${parsed.cases.length} 条公告，包含按时间归档的分析与修订。` : `${parsed.cases.length} announcements are archived with dated analyses and revisions.`}</p></header>
    <label className="valve-history__search">{zh ? '搜索案例' : 'Search cases'}<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={zh ? '搜索' : 'Search'} /></label>
    {cases.length ? cases.map(entry => <HistoryCase key={entry.event_id} entry={entry} />) : <p role="status">{zh ? '没有匹配的历史案例。' : 'No matching cases.'}</p>}
  </section>
}
