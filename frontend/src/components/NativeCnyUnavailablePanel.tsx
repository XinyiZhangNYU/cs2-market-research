import { useLang } from '../i18n'

/** Unsupported native surfaces must not mount inherited result consumers. */
export function NativeCnyUnavailablePanel({ surface }: { surface: 'home' | 'watchlist' | 'result' }) {
  const lang = useLang()
  const note = {
    home: ['首页摘要尚未提供。', 'The home summary is not available yet.'],
    watchlist: ['单品当前列表和历史尚未提供。', 'Current item lists and history are not available yet.'],
    result: ['该商品的 CNY 结果尚未提供。', 'CNY results for this item are not available yet.'],
  }[surface][lang === 'zh' ? 0 : 1]
  return <section role="status" data-testid={`native-cny-unavailable-${surface}`} data-state="UNAVAILABLE">
    <h2>{lang === 'zh' ? 'CNY 数据暂不可用' : 'CNY data unavailable'}</h2>
    <p>{note}</p>
  </section>
}
