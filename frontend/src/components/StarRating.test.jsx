import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StarRating from './StarRating'

describe('StarRating component', () => {
  // 1) It always renders 5 star buttons
  it('renders 5 stars', () => {
    render(<StarRating value={0} onChange={() => {}} />)
    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
  })

  // 2) Clicking a star calls onChange with that star's value
  it('calls onChange with the clicked star value', () => {
    const handleChange = vi.fn()
    render(<StarRating value={0} onChange={handleChange} />)

    const stars = screen.getAllByRole('button')
    fireEvent.click(stars[2]) // click the 3rd star

    expect(handleChange).toHaveBeenCalledWith(3)
  })

  // 3) In readonly mode the stars are disabled (cannot be clicked)
  it('disables the stars when readonly', () => {
    render(<StarRating value={4} readonly />)
    const stars = screen.getAllByRole('button')
    stars.forEach((star) => expect(star).toBeDisabled())
  })
})
