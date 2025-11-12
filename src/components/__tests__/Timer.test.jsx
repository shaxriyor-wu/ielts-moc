import { render, screen, waitFor } from '@testing-library/react'
import Timer from '../Timer'

describe('Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders initial time correctly', () => {
    render(<Timer initialSeconds={120} />)
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('counts down correctly', async () => {
    const onComplete = jest.fn()
    render(<Timer initialSeconds={5} onComplete={onComplete} />)

    expect(screen.getByText('0:05')).toBeInTheDocument()

    jest.advanceTimersByTime(2000)
    await waitFor(() => {
      expect(screen.getByText('0:03')).toBeInTheDocument()
    })
  })

  it('calls onComplete when timer reaches zero', async () => {
    const onComplete = jest.fn()
    render(<Timer initialSeconds={2} onComplete={onComplete} />)

    jest.advanceTimersByTime(2000)
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('shows warning when less than 5 minutes remain', () => {
    render(<Timer initialSeconds={240} />)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveClass('bg-accent-100')
  })
})

