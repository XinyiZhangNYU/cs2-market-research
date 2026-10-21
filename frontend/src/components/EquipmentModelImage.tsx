import { useState } from 'react'
import { equipmentImageForModel } from '../catalog/equipmentImages'
import { sectorIllustrationImage } from '../catalog/sectorIllustrations'
import { pick, useLang } from '../i18n'

export function EquipmentModelImage({ modelId }: { modelId: string }) {
  const image = equipmentImageForModel(modelId) ?? sectorIllustrationImage(modelId)
  // Keyed by the exact model/asset revision: failures must not switch to another image.
  return image ? <ModelImage key={image.src} src={image.src} modelId={modelId} /> : null
}

function ModelImage({ src, modelId }: { src: string; modelId: string }) {
  const lang = useLang()
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'UNAVAILABLE'>('LOADING')
  return (
    <span className="equipment-model-image" data-testid={`equipment-image-${modelId}`} data-image-state={status} aria-hidden="true">
      {status !== 'UNAVAILABLE' ? (
        <img
          src={src} alt="" width={512} height={384} loading="lazy" decoding="async"
          referrerPolicy="no-referrer" draggable={false}
          onLoad={() => setStatus('READY')} onError={() => setStatus('UNAVAILABLE')}
        />
      ) : <small>{pick({ zh: '图片暂不可用', en: 'Image unavailable' }, lang)}</small>}
    </span>
  )
}
