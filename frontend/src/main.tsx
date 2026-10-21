import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createLiveCatalogDisplayRuntime } from './api/catalogDisplayRuntime'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')
const liveCatalog = createLiveCatalogDisplayRuntime()
createRoot(root).render(
  <StrictMode>
    <App
      catalogGateway={liveCatalog.gateway}
      catalogSnapshotQueryAsOf={liveCatalog.snapshotQueryAsOf}
      catalogSnapshotKnownAt={liveCatalog.snapshotKnownAt}
    />
  </StrictMode>,
)
