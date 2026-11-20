export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Escape a string for use inside a RegExp. */
export const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
