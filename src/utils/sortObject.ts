export default function sortObject<T extends Record<string, unknown>>(obj: T): Record<string, string> {
  const str: string[] = []

  // Collect and encode keys
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key))
    }
  }

  // Sort encoded keys
  str.sort()

  // Create sorted object with encoded values
  const sorted: Record<string, string> = {}
  for (const key of str) {
    const originalValue = obj[key]
    sorted[key] = encodeURIComponent(String(originalValue)).replace(/%20/g, '+')
  }

  return sorted
}
