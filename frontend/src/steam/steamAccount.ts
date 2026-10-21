const STEAMID64 = /^7656119[0-9]{10}$/u
const CONTROL = /[\u0000-\u001f\u007f]/u

export type SteamAccountParseFailure = 'EMPTY' | 'INVALID' | 'VANITY'

export type SteamAccountParse =
  | Readonly<{ ok: true; steamid: string }>
  | Readonly<{ ok: false; code: SteamAccountParseFailure }>

function hostIsSteamCommunity(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'steamcommunity.com' || host === 'www.steamcommunity.com'
}

function parseAsUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    try {
      return new URL(`https://${value}`)
    } catch {
      return null
    }
  }
}

export function parseSteamAccountInput(raw: string): SteamAccountParse {
  if (typeof raw !== 'string') return { ok: false, code: 'INVALID' }
  const trimmed = raw.trim()
  if (trimmed.length === 0) return { ok: false, code: 'EMPTY' }
  if (CONTROL.test(trimmed) || trimmed.length > 512) return { ok: false, code: 'INVALID' }
  if (STEAMID64.test(trimmed)) return { ok: true, steamid: trimmed }

  const url = parseAsUrl(trimmed)
  if (url === null) return { ok: false, code: 'INVALID' }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, code: 'INVALID' }
  if (url.username !== '' || url.password !== '') return { ok: false, code: 'INVALID' }
  if (!hostIsSteamCommunity(url.hostname)) return { ok: false, code: 'INVALID' }

  const parts = url.pathname.split('/').filter((part) => part.length > 0)
  if (parts[0] === 'id') return { ok: false, code: 'VANITY' }
  if (parts[0] === 'profiles' && typeof parts[1] === 'string' && STEAMID64.test(parts[1])) {
    return { ok: true, steamid: parts[1] }
  }
  return { ok: false, code: 'INVALID' }
}
