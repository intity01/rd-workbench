import { useStore } from '../state/StoreProvider'

const T: Record<string, [string, string]> = {
  home: ['Home', 'หน้าหลัก'],
  projects: ['Projects', 'โปรเจกต์'],
  research: ['Research', 'งานวิจัย'],
  library: ['Knowledge Library', 'คลังความรู้'],
  map: ['Knowledge Map', 'แผนที่ความรู้'],
  tasks: ['Tasks & Workflows', 'งานและเวิร์กโฟลว์'],
  settings: ['Settings', 'การตั้งค่า'],
  help: ['Help / About', 'ช่วยเหลือ'],
}

/** Minimal label dictionary for navigation; falls back to the key. */
export function useT() {
  const { settings } = useStore()
  const i = settings.language === 'ไทย' ? 1 : 0
  return (k: string) => T[k]?.[i] ?? k
}
