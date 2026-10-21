import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const path = new URL('../src/data/valveAnalysisHistory.public.json',import.meta.url)
const raw = readFileSync(path,'utf8')
const data = JSON.parse(raw)
function canonical(value) {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']'
  if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
  return JSON.stringify(value)
}
const { release_id, ...content } = data
if (raw !== canonical(data)+'\n' || createHash('sha256').update(canonical(content)+'\n').digest('hex') !== release_id) throw new Error('Public history release differs from canonical export')
if (!['valve-analysis-history-public/v1','valve-analysis-history-public/v2','valve-analysis-history-public/v3'].includes(data.schema_id)) throw new Error('Unknown public history contract')
for (const entry of data.cases) for (const version of entry.versions) {
  if (version.status !== 'PUBLIC' && (version.analysis !== null || version.labels.length)) throw new Error('Private analysis body in public export')
  if (entry.withdrawn && (version.analysis || version.comments.length || version.labels.length)) throw new Error('Withdrawn body in public export')
  if (version.status === 'PUBLIC' && version.analysis && 'zh_cn' in version.analysis) {
    if (data.schema_id !== 'valve-analysis-history-public/v3') throw new Error('Bilingual article under legacy public contract')
    if (Object.keys(version.analysis).sort().join(',') !== 'en,zh_cn') throw new Error('Bilingual article locale set differs')
    for (const locale of ['zh_cn','en']) {
      const article=version.analysis[locale]
      if (!article || Object.keys(article).sort().join(',') !== 'body,title' || !article.title?.trim() || !article.body?.trim()) throw new Error('Bilingual article is incomplete')
    }
  }
}
if (/evidence_audit|source_output_sha256|public_authorization_ref|approved_content_sha256|C:\\\\/.test(raw)) throw new Error('Private history metadata in public export')
console.log(`Public history: ${data.cases.length} cases, canonical release verified`)
