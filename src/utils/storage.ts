export function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveStoredJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}
