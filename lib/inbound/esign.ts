export function detectEsignPlatform(from: string, subject: string | undefined): string | null {
  const combined = `${from} ${subject ?? ''}`.toLowerCase()
  if (combined.includes('docusign')) return 'docusign'
  if (combined.includes('dotloop')) return 'dotloop'
  if (combined.includes('authentisign')) return 'authentisign'
  if (combined.includes('skyslope')) return 'skyslope'
  return null
}
