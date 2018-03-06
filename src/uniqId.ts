// Generate unique variable name
export const uniqId = (() => {
  let counter = 0
  return (name: string): string => `${name}${counter++}`
})()
