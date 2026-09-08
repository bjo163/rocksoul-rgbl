import type { CanonicalPosition } from './types.js'

export function formatCanonicalPosition(pos: CanonicalPosition): string {
  const parts: string[] = []

  if (pos.surah !== undefined && pos.ayah !== undefined) {
    parts.push(String(pos.surah), String(pos.ayah))
  } else if (pos.book !== undefined && pos.chapter !== undefined && pos.verse !== undefined) {
    parts.push(String(pos.book).toLowerCase(), String(pos.chapter), String(pos.verse))
  } else if (pos.chapter !== undefined && pos.verse !== undefined) {
    parts.push(String(pos.chapter), String(pos.verse))
  } else if (pos.tractate !== undefined && pos.chapter !== undefined && pos.mishnah !== undefined) {
    parts.push(String(pos.tractate).toLowerCase(), String(pos.chapter), String(pos.mishnah))
  } else if (pos.tractate !== undefined && pos.daf !== undefined) {
    parts.push(String(pos.tractate).toLowerCase(), String(pos.daf).toLowerCase())
  } else if (pos.mandala !== undefined && pos.sukta !== undefined && pos.rik !== undefined) {
    parts.push(String(pos.mandala), String(pos.sukta), String(pos.rik))
  } else if (pos.pada !== undefined && pos.sutra !== undefined) {
    parts.push(String(pos.pada), String(pos.sutra))
  } else if (pos.chapter !== undefined && pos.sutra !== undefined) {
    parts.push(String(pos.chapter), String(pos.sutra))
  } else if (pos.vagga !== undefined && pos.verse !== undefined) {
    parts.push(String(pos.vagga), String(pos.verse))
  } else if (pos.sutta !== undefined) {
    parts.push(String(pos.sutta).toLowerCase())
    if (pos.section !== undefined) parts.push(String(pos.section))
  } else if (pos.hadith !== undefined) {
    if (pos.book !== undefined) parts.push(String(pos.book))
    parts.push(String(pos.hadith))
  } else if (pos.ang !== undefined && pos.shabad !== undefined) {
    parts.push(String(pos.ang), String(pos.shabad))
    if (pos.line !== undefined) parts.push(String(pos.line))
  } else if (pos.pauri !== undefined) {
    parts.push(String(pos.pauri))
  } else if (pos.part !== undefined && pos.verse !== undefined) {
    parts.push(String(pos.part), String(pos.verse))
  } else if (pos.paragraph !== undefined) {
    if (pos.part !== undefined) parts.push(String(pos.part))
    parts.push(String(pos.paragraph))
  } else if (pos.verse !== undefined) {
    parts.push(String(pos.verse))
  } else if (pos.line !== undefined) {
    parts.push(String(pos.line))
  } else if (pos.custom) {
    for (const [k, v] of Object.entries(pos.custom)) {
      parts.push(`${k}-${v}`)
    }
  }

  return parts.join(':')
}

export function validateCanonicalPosition(pos: CanonicalPosition): boolean {
  if (!pos || typeof pos !== 'object' || !pos.workId) return false
  const formatted = formatCanonicalPosition(pos)
  return formatted.length > 0
}
