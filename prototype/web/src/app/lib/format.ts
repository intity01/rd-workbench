/** Elapsed seconds as mm:ss. */
export const fmt = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
export const today = () => new Date().toISOString().slice(0, 10)
export const stamp = () => `${today()} ${now()}`

let counter = 100
/** Session-unique ids such as `SRC-101`, `N-102`. */
export const nextId = (prefix: string) => `${prefix}-${String(++counter).padStart(3, '0')}`
