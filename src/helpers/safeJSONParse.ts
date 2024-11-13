export const safeJSONParse = (str: string) => {
  try {
    // Replace single quotes with double quotes
    const jsonString = str
      .replace(/'/g, '"')
      // Handle the case where 'None' appears in the JSON
      .replace(/: None/g, ': null')
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('JSON parsing error:', error)
    return null
  }
}
