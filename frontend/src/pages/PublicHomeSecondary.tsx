import type { MouseEvent } from 'react'
import type { MarketSectorIndexPublicApi } from '../api/MarketSectorIndexPublicApi'
import type { SingleItemTrendingPublicGateway } from '../api/SingleItemTrendingPublicApi'
import type { ItemCurrentPublicGateway } from '../api/ItemCurrentPublicApi'
import type { ValveEventsGateway } from '../api/ValveEventsApi'
import { HomeSectorStrip, HomeMovers, HomeItemCurrent, HomeValve } from './PublicHomeModules'
import type { HomeDirectory } from '../performance/homeDirectory'

export function PublicHomeSecondary({ active, marketIndexApi, preparedDirectory, trendingGateway, itemCurrentGateway,
  valveGateway, sectorHref, trendingHref, watchlistHref, valveHref,
  onSectorClick, onTrendingClick, onWatchlistClick, onValveClick,
}: {
  active: boolean
  preparedDirectory?: HomeDirectory
  marketIndexApi: MarketSectorIndexPublicApi
  trendingGateway: SingleItemTrendingPublicGateway
  itemCurrentGateway?: ItemCurrentPublicGateway
  valveGateway?: ValveEventsGateway
  sectorHref: (scopeCode: string | null) => string
  trendingHref: string
  watchlistHref: string
  valveHref: string
  onSectorClick: (event: MouseEvent<HTMLAnchorElement>, scopeCode: string | null) => void
  onTrendingClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onWatchlistClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onValveClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  return <>
    <HomeSectorStrip active={active} api={marketIndexApi} preparedDirectory={preparedDirectory} sectorHref={sectorHref} onSectorClick={onSectorClick} />
    <div className="public-home__modules">
      <HomeMovers active={active} gateway={trendingGateway} href={trendingHref} onClick={onTrendingClick} />
      <HomeItemCurrent active={active} gateway={itemCurrentGateway} href={watchlistHref} onClick={onWatchlistClick} />
      <HomeValve active={active} gateway={valveGateway} href={valveHref} onClick={onValveClick} />
    </div>
  </>
}
