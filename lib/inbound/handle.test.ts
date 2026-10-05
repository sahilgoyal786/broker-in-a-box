import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))

import { isValidHandle, slugifyBrokerageName } from './handle'

describe('slugifyBrokerageName', () => {
  it('lowercases and strips punctuation', () => {
    expect(slugifyBrokerageName('Acme Realty, LLC')).toBe('acmerealtyllc')
    expect(slugifyBrokerageName('Neon Realtors INC')).toBe('neonrealtorsinc')
    expect(slugifyBrokerageName('Café & Co.')).toBe('cafeandco')
  })
})

describe('isValidHandle', () => {
  it('rejects reserved, short and malformed handles', () => {
    expect(isValidHandle('admin')).toBe(false)
    expect(isValidHandle('ab')).toBe(false)
    expect(isValidHandle('has-dash')).toBe(false)
    expect(isValidHandle('acmerealty')).toBe(true)
  })
})
