import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { authAPI } from '../../utils/api'

jest.mock('../../utils/api')

const TestComponent = () => {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('provides auth context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
  })

  it('handles login', async () => {
    authAPI.login.mockResolvedValue({
      token: 'test-token',
      refreshToken: 'test-refresh',
      user: { id: '1', name: 'Test User', email: 'test@test.com' },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    loginButton.click()

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
  })
})

