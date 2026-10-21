import { useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { EnumChip, EnumPresentation } from '../components/EnumChip'
import { itemKindLabel, wearTierLabel } from '../contract/catalogBrowse'
import { editionKindLabel, label } from '../contract/labels'
import { pick, useLang, type Lang, type Localized } from '../i18n'
import { t, tf } from '../i18n/strings'
import {
  PersonalWatchlistCorruptError,
  isItemTarget,
  personalWatchlistImage,
  type PersonalWatchTarget,
  type PersonalWatchTargetKind,
  type PersonalWatchlistController,
} from '../watchlist/personalWatchlist'
import {
  resolveParentWatchTargetKey,
  resolveWatchTarget,
  type ResolvedWatchTarget,
  type WatchTargetDestination,
} from '../watchlist/watchTargetRegistry'

type GroupMode = 'NONE' | 'TARGET_KIND' | 'PARENT'
type SortMode = 'ADDED_DESC' | 'NAME_ASC'

type KindLabelKey =
  | 'personalWatchlistKindItem'
  | 'personalWatchlistKindCatalogCategory'
  | 'personalWatchlistKindCatalogGroup'
  | 'personalWatchlistKindCatalogModel'
  | 'personalWatchlistKindEconomicSector'
  | 'personalWatchlistKindEconomicSegment'

const KIND_LABEL: Readonly<Record<PersonalWatchTargetKind, KindLabelKey>> = {
  ITEM: 'personalWatchlistKindItem',
  CATALOG_CATEGORY: 'personalWatchlistKindCatalogCategory',
  CATALOG_GROUP: 'personalWatchlistKindCatalogGroup',
  CATALOG_MODEL: 'personalWatchlistKindCatalogModel',
  ECONOMIC_SECTOR: 'personalWatchlistKindEconomicSector',
  ECONOMIC_SEGMENT: 'personalWatchlistKindEconomicSegment',
}

const KIND_ORDER: Readonly<Record<PersonalWatchTargetKind, number>> = {
  CATALOG_CATEGORY: 0,
  CATALOG_GROUP: 1,
  CATALOG_MODEL: 2,
  ECONOMIC_SECTOR: 3,
  ECONOMIC_SEGMENT: 4,
  ITEM: 5,
}

/** The call to action always names the destination that actually exists. */
function openLabelKey(destination: WatchTargetDestination | null, kind: PersonalWatchTargetKind) {
  if (destination === null) return 'personalWatchlistTargetUnavailable'
  if (destination.surface === 'PRODUCT') return 'personalWatchlistOpenProduct'
  if (destination.surface === 'CATALOG') return 'personalWatchlistOpenCatalog'
  return kind === 'ECONOMIC_SEGMENT'
    ? 'personalWatchlistOpenSegment'
    : 'personalWatchlistOpenSector'
}

function normalizeSearch(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase()
}

function displayName(target: PersonalWatchTarget, resolved: ResolvedWatchTarget | null): Localized {
  // A retired object keeps the bilingual name it was saved with; nothing is renamed or remapped.
  return resolved?.name ?? target.localized_name
}

function TargetRow({
  target,
  resolved,
  controller,
  destinationHref,
  onOpen,
}: {
  target: PersonalWatchTarget
  resolved: ResolvedWatchTarget | null
  controller: PersonalWatchlistController
  destinationHref: (destination: WatchTargetDestination) => string
  onOpen: (destination: WatchTargetDestination) => void
}) {
  const lang = useLang()
  const name = pick(displayName(target, resolved), lang)
  const destination = resolved?.destination ?? null
  const openLabel = t(openLabelKey(destination, target.target_kind), lang)
  const kindLabel = t(KIND_LABEL[target.target_kind], lang)
  const parent = target.parent_target_key !== null
    ? resolveParentWatchTargetKey(target.parent_target_key)
    : null

  const body = (
    <>
      {isItemTarget(target) ? (
        <ItemImageSlot
          source={personalWatchlistImage(target)}
          label={name}
          variant="thumbnail"
          presentation="PRODUCT"
          testId={`personal-watchlist-image-${target.target_key}`}
        />
      ) : null}
      <span className="personal-watchlist__item-copy">
        <span className="personal-watchlist__kind" data-watchlist-target-kind={target.target_kind}>
          {kindLabel}
        </span>
        <strong>{name}</strong>
        {isItemTarget(target) ? (
          <>
            <span>{pick(itemKindLabel[target.identity.item_kind], lang)}</span>
            <span className="personal-watchlist__chips">
              <EnumChip
                machine={target.identity.edition_kind}
                label={label(editionKindLabel, target.identity.edition_kind, lang)}
                presentation={EnumPresentation.PRODUCT_PRIMARY}
              />
              <EnumChip
                machine={target.identity.wear_tier}
                label={pick(wearTierLabel[target.identity.wear_tier], lang)}
                presentation={EnumPresentation.PRODUCT_PRIMARY}
              />
            </span>
          </>
        ) : parent ? (
          <span className="personal-watchlist__parent">{pick(parent.name, lang)}</span>
        ) : null}
        <span className="personal-watchlist__open">
          {openLabel} {destination ? <span aria-hidden="true">→</span> : null}
        </span>
      </span>
    </>
  )

  return (
    <li data-testid={`personal-watchlist-item-${target.target_key}`} data-watchlist-target-kind={target.target_kind}>
      <article>
        {destination ? (
          <a
            className="personal-watchlist__item-link"
            href={destinationHref(destination)}
            onClick={(event) => {
              event.preventDefault()
              onOpen(destination)
            }}
          >
            {body}
          </a>
        ) : (
          <span
            className="personal-watchlist__item-link personal-watchlist__item-link--unavailable"
            data-testid={`personal-watchlist-unavailable-${target.target_key}`}
          >
            {body}
            <span className="personal-watchlist__unavailable-note">
              {t('personalWatchlistTargetUnavailableNote', lang)}
            </span>
          </span>
        )}
        <button
          type="button"
          className="personal-watchlist__remove"
          disabled={controller.pendingKeys.has(target.target_key)}
          aria-label={`${t('personalWatchlistRemove', lang)}: ${name}`}
          onClick={(event) => {
            event.stopPropagation()
            void controller.remove(target.target_key)
          }}
        >
          <span aria-hidden="true">×</span>
          <span>{t('personalWatchlistRemove', lang)}</span>
        </button>
      </article>
    </li>
  )
}

function StorageProblem({
  controller,
}: {
  controller: PersonalWatchlistController
}) {
  const lang = useLang()
  const corrupt = controller.error === 'CORRUPT'
  return (
    <section className="personal-watchlist__problem" role="alert" data-testid="personal-watchlist-problem">
      <h2>{t(corrupt ? 'personalWatchlistCorruptTitle' : 'personalWatchlistUnavailableTitle', lang)}</h2>
      <p>{t(corrupt ? 'personalWatchlistCorruptNote' : 'personalWatchlistUnavailableNote', lang)}</p>
      <button type="button" onClick={controller.reload}>{t('personalWatchlistRetry', lang)}</button>
    </section>
  )
}

type WatchRow = Readonly<{
  target: PersonalWatchTarget
  resolved: ResolvedWatchTarget | null
  name: Localized
}>

function groupTitle(
  mode: GroupMode,
  row: WatchRow,
  lang: Lang,
): Readonly<{ id: string; title: string; order: number }> {
  if (mode === 'TARGET_KIND') {
    return {
      id: `KIND:${row.target.target_kind}`,
      title: t(KIND_LABEL[row.target.target_kind], lang),
      order: KIND_ORDER[row.target.target_kind],
    }
  }
  // Items declare no parent, so they never get filed under a catalog or economic parent.
  if (row.target.target_kind === 'ITEM') {
    return { id: 'PARENT:ITEM', title: t('personalWatchlistKindItem', lang), order: 5 }
  }
  const root = row.target.target_kind === 'CATALOG_CATEGORY' ||
    row.target.target_kind === 'ECONOMIC_SECTOR'
  const parentKey = root
    ? row.target.target_key
    : row.target.parent_target_key
  const parent = root
    ? row.resolved
    : resolveParentWatchTargetKey(row.target.parent_target_key)
  return {
    id: `PARENT:${parentKey}`,
    title: parent ? pick(parent.name, lang) : t('personalWatchlistTargetUnavailable', lang),
    order: 0,
  }
}

export function PersonalWatchlistPage({
  controller,
  catalogHref,
  onCatalogClick,
  destinationHref,
  onOpenDestination,
}: {
  controller: PersonalWatchlistController
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  destinationHref: (destination: WatchTargetDestination) => string
  onOpenDestination: (destination: WatchTargetDestination) => void
}) {
  const lang = useLang()
  const fileInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('NONE')
  const [sortMode, setSortMode] = useState<SortMode>('ADDED_DESC')
  const [confirmClear, setConfirmClear] = useState(false)
  const [transferMessage, setTransferMessage] = useState<string | null>(null)
  const normalizedQuery = normalizeSearch(query)

  const rows = useMemo<readonly WatchRow[]>(() => controller.entries.map((target) => {
    const resolved = resolveWatchTarget(target)
    return { target, resolved, name: displayName(target, resolved) }
  }), [controller.entries])

  const filtered = useMemo(() => {
    const matching = rows.filter((row) => {
      if (normalizedQuery === '') return true
      // Both display names and the stable id are searchable.
      const haystack = normalizeSearch([
        row.name.zh,
        row.name.en,
        row.target.target_id,
        isItemTarget(row.target) ? row.target.identity.base_item_code : '',
      ].join(' '))
      return haystack.includes(normalizedQuery)
    })
    return [...matching].sort((left, right) => {
      if (sortMode === 'ADDED_DESC') {
        if (left.target.added_at !== right.target.added_at) {
          return left.target.added_at > right.target.added_at ? -1 : 1
        }
      } else {
        const byName = pick(left.name, lang).localeCompare(
          pick(right.name, lang),
          lang === 'zh' ? 'zh-CN' : 'en',
        )
        if (byName !== 0) return byName
      }
      return left.target.target_key.localeCompare(right.target.target_key)
    })
  }, [lang, normalizedQuery, rows, sortMode])

  const groups = useMemo(() => {
    if (groupMode === 'NONE') return [{ id: 'ALL', title: null, rows: filtered }]
    const buckets = new Map<string, { id: string; title: string; order: number; rows: WatchRow[] }>()
    for (const row of filtered) {
      const descriptor = groupTitle(groupMode, row, lang)
      const bucket = buckets.get(descriptor.id) ?? { ...descriptor, rows: [] }
      bucket.rows.push(row)
      buckets.set(descriptor.id, bucket)
    }
    return [...buckets.values()]
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
      .map((bucket) => ({ id: bucket.id, title: bucket.title, rows: bucket.rows }))
  }, [filtered, groupMode, lang])

  const exportItems = () => {
    setTransferMessage(null)
    try {
      const source = controller.exportJson()
      const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cs2-rotate-watchlist-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setTransferMessage(t('personalWatchlistExportReady', lang))
    } catch {
      setTransferMessage(t('personalWatchlistTransferFailed', lang))
    }
  }

  const importItems = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setTransferMessage(null)
    if (file.size > 5_000_000) {
      setTransferMessage(t('personalWatchlistImportInvalid', lang))
      return
    }
    try {
      const count = await controller.importJson(await file.text())
      setTransferMessage(tf('personalWatchlistImportReady', lang, { count }))
    } catch (error) {
      setTransferMessage(t(
        error instanceof PersonalWatchlistCorruptError
          ? 'personalWatchlistImportInvalid'
          : 'personalWatchlistTransferFailed',
        lang,
      ))
    }
  }

  return (
    <article className="personal-watchlist" data-testid="personal-watchlist-page">
      <header className="personal-watchlist__hero">
        <div>
          <p>{t('personalWatchlistEyebrow', lang)}</p>
          <h1>{t('personalWatchlistTitle', lang)}</h1>
          <p>{t('personalWatchlistIntro', lang)}</p>
        </div>
        <aside>
          <span className="personal-watchlist__privacy-title">
            {t('personalWatchlistLocalTitle', lang)}
          </span>
          <span className="personal-watchlist__summary">
            <strong>{controller.entries.length}</strong>
            <span>{t('personalWatchlistCount', lang)}</span>
          </span>
          <small>{t('personalWatchlistLocalNote', lang)}</small>
        </aside>
      </header>

      {controller.status === 'LOADING' ? (
        <div className="personal-watchlist__loading" role="status">
          {t('personalWatchlistLoading', lang)}
        </div>
      ) : controller.status === 'ERROR' ? (
        <StorageProblem controller={controller} />
      ) : (
        <>
          <section className="personal-watchlist__toolbar" aria-label={t('personalWatchlistTools', lang)}>
            <label className="personal-watchlist__search">
              <span>{t('personalWatchlistSearchLabel', lang)}</span>
              <input
                type="search"
                value={query}
                placeholder={t('personalWatchlistSearchPlaceholder', lang)}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </label>
            <label>
              <span>{t('personalWatchlistGroupLabel', lang)}</span>
              <select value={groupMode} onChange={(event) => setGroupMode(event.currentTarget.value as GroupMode)}>
                <option value="NONE">{t('personalWatchlistGroupNone', lang)}</option>
                <option value="TARGET_KIND">{t('personalWatchlistGroupTargetKind', lang)}</option>
                <option value="PARENT">{t('personalWatchlistGroupParent', lang)}</option>
              </select>
            </label>
            <label>
              <span>{t('personalWatchlistSortLabel', lang)}</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.currentTarget.value as SortMode)}>
                <option value="ADDED_DESC">{t('personalWatchlistSortRecent', lang)}</option>
                <option value="NAME_ASC">{t('personalWatchlistSortName', lang)}</option>
              </select>
            </label>
            <div className="personal-watchlist__transfer">
              <button type="button" onClick={exportItems} disabled={controller.entries.length === 0}>
                {t('personalWatchlistExport', lang)}
              </button>
              <button type="button" onClick={() => fileInput.current?.click()}>
                {t('personalWatchlistImport', lang)}
              </button>
              <input
                ref={fileInput}
                className="personal-watchlist__file-input"
                type="file"
                accept="application/json,.json"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => void importItems(event)}
              />
              <button
                type="button"
                className="personal-watchlist__clear-action"
                disabled={controller.entries.length === 0}
                onClick={() => setConfirmClear(true)}
              >
                {t('personalWatchlistClear', lang)}
              </button>
            </div>
          </section>

          <p className="personal-watchlist__scope-note">{t('personalWatchlistScopeNote', lang)}</p>

          {confirmClear ? (
            <section className="personal-watchlist__clear-confirm" role="alert">
              <div>
                <strong>{t('personalWatchlistClearTitle', lang)}</strong>
                <p>{t('personalWatchlistClearNote', lang)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void controller.clear()
                  setConfirmClear(false)
                }}
              >
                {t('personalWatchlistClearConfirm', lang)}
              </button>
              <button type="button" onClick={() => setConfirmClear(false)}>
                {t('personalWatchlistCancel', lang)}
              </button>
            </section>
          ) : null}

          {transferMessage ? <p className="personal-watchlist__transfer-status" role="status">{transferMessage}</p> : null}
          {controller.error === 'OPERATION_FAILED' ? (
            <p className="personal-watchlist__operation-error" role="alert">
              {t('personalWatchlistOperationFailed', lang)}
            </p>
          ) : null}

          {controller.entries.length === 0 ? (
            <section className="personal-watchlist__empty">
              <h2>{t('personalWatchlistEmptyTitle', lang)}</h2>
              <a href={catalogHref} onClick={onCatalogClick}>{t('personalWatchlistBrowseCatalog', lang)}</a>
            </section>
          ) : filtered.length === 0 ? (
            <section className="personal-watchlist__empty" data-testid="personal-watchlist-no-match">
              <h2>{t('personalWatchlistNoMatchTitle', lang)}</h2>
              <button type="button" onClick={() => setQuery('')}>{t('personalWatchlistClearSearch', lang)}</button>
            </section>
          ) : (
            <div className="personal-watchlist__groups">
              {groups.map((group) => (
                <section key={group.id}>
                  {group.title ? (
                    <header>
                      <h2>{group.title}</h2>
                      <span>{tf('personalWatchlistGroupCount', lang, { count: group.rows.length })}</span>
                    </header>
                  ) : null}
                  <ul className="personal-watchlist__items">
                    {group.rows.map((row) => (
                      <TargetRow
                        key={row.target.target_key}
                        target={row.target}
                        resolved={row.resolved}
                        controller={controller}
                        destinationHref={destinationHref}
                        onOpen={onOpenDestination}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}
