import { useState } from 'react'
import { equipmentImageForBaseSeries } from '../catalog/equipmentImages'
import type { ItemKind } from '../contract/catalogBrowse'
import type { ItemImageSource } from '../contract/itemImage'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { ItemImageSlot, type ItemImageRenderStatus } from './ItemImageSlot'

export function CatalogSeriesImageSlot({
  source,
  itemKind,
  baseItemCode,
  label,
  testId,
}: {
  source: ItemImageSource
  itemKind: ItemKind
  baseItemCode: string
  label: string
  testId: string
}) {
  const illustration = source.status === 'NOT_PRODUCED'
    ? equipmentImageForBaseSeries(itemKind, baseItemCode)
    : undefined
  if (!illustration) {
    return <ItemImageSlot source={source} label={label} variant="thumbnail" presentation="PRODUCT" testId={testId} />
  }
  return <BaseSeriesIllustration key={illustration.src} src={illustration.src} label={label} testId={testId} />
}

function BaseSeriesIllustration({ src, label, testId }: { src: string; label: string; testId: string }) {
  const lang = useLang()
  const [status, setStatus] = useState<Exclude<ItemImageRenderStatus, 'NOT_PRODUCED'>>('LOADING')
  const statusText = status === 'LOADING'
    ? t('itemImageLoading', lang)
    : status === 'LOAD_FAILED'
      ? t('itemImageLoadFailed', lang)
      : t('itemImageBound', lang)
  return (
    <figure
      className={`item-image-slot item-image-slot--thumbnail item-image-slot--${status.toLowerCase().replaceAll('_', '-')}`}
      data-testid={testId}
      data-image-source="EQUIPMENT_ILLUSTRATION"
      data-image-status={status}
      data-image-presentation="PRODUCT"
      aria-busy={status === 'LOADING'}
    >
      <img
        className="item-image-slot__image"
        src={src}
        alt={label}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setStatus('BOUND')}
        onError={() => setStatus('LOAD_FAILED')}
      />
      {status !== 'BOUND' ? <div className="item-image-slot__fallback" aria-hidden="true" /> : null}
      {status !== 'BOUND' ? <figcaption className="item-image-slot__status" aria-live="polite"><span>{statusText}</span></figcaption> : null}
    </figure>
  )
}
