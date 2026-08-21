declare module '*.module.css' {
  const classes: Record<string, string>
  export const cssText: string
  export const cssTagId: string
  export default classes
}
