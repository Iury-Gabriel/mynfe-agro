import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FiscalStatusPill } from './fiscal-status-pill'

describe('FiscalStatusPill', () => {
  it('renderiza o label do status', () => {
    render(<FiscalStatusPill status="autorizada" />)
    expect(screen.getByText('Autorizada')).toBeInTheDocument()
  })

  it('renderiza emitindo', () => {
    render(<FiscalStatusPill status="emitindo" />)
    expect(screen.getByText('Emitindo')).toBeInTheDocument()
  })
})
