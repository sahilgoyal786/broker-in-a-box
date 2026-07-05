'use client'

import type { InputHTMLAttributes } from 'react'
import { formatPhoneNumber } from '@/lib/phone'

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'defaultValue'> & {
  defaultValue?: string | null
}

export default function PhoneInput({ defaultValue, onChange, ...props }: PhoneInputProps) {
  return (
    <input
      {...props}
      type="tel"
      defaultValue={formatPhoneNumber(defaultValue)}
      onChange={(event) => {
        event.currentTarget.value = formatPhoneNumber(event.currentTarget.value)
        onChange?.(event)
      }}
    />
  )
}
