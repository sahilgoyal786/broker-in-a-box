import { describe, expect, it } from 'vitest'
import { collectRecipientCandidates, handleFromAddress } from './resolve-recipient'

const h = (name: string, value: string) => ({ name, value })

describe('handleFromAddress', () => {
  it('extracts the handle and strips +tags', () => {
    expect(handleFromAddress('AcmeRealty@brokercommandcenter.com')).toBe('acmerealty')
    expect(handleFromAddress('acme+deals@brokercommandcenter.com')).toBe('acme')
  })
  it('rejects other domains', () => {
    expect(handleFromAddress('acme@gmail.com')).toBeNull()
    expect(handleFromAddress('acme@evil.brokercommandcenter.com')).toBeNull()
  })
})

describe('collectRecipientCandidates', () => {
  it('finds the alias in Delivered-To when To is the original recipient (forwarded mail)', () => {
    const c = collectRecipientCandidates([
      h('To', 'Agent Smith <smith@gmail.com>'),
      h('Delivered-To', 'acmerealty@brokercommandcenter.com'),
    ])
    expect(c.map((x) => x.handle)).toEqual(['acmerealty'])
    expect(c[0].source).toBe('delivered-to')
  })

  it('orders by header priority and de-duplicates', () => {
    const c = collectRecipientCandidates([
      h('To', 'neon@brokercommandcenter.com'),
      h('X-Forwarded-To', 'acme@brokercommandcenter.com'),
      h('Cc', 'acme@brokercommandcenter.com'),
    ])
    expect(c.map((x) => x.handle)).toEqual(['acme', 'neon'])
  })

  it('reads the recipient from a Received "for" clause', () => {
    const c = collectRecipientCandidates([
      h('Received', 'by mx.google.com with ESMTPS id x for <acme@brokercommandcenter.com>; Mon, 5 Oct 2026'),
    ])
    expect(c).toEqual([{ address: 'acme@brokercommandcenter.com', handle: 'acme', source: 'received' }])
  })

  it('returns nothing when no header mentions our domain', () => {
    expect(collectRecipientCandidates([h('To', 'a@b.com')])).toEqual([])
  })
})
