import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from '@/components/ui/provider';
import Page from './page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('UserAccountCreation Page', () => {
  test('renders the account creation screen', () => {
    render(
      <Provider>
        <Page />
      </Provider>
    );

    expect(screen.getByText(/^Create Account$/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/display name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument();
  });

  test('enables create account only when passwords match', () => {
    render(
      <Provider>
        <Page />
      </Provider>
    );

    const displayNameInput = screen.getByLabelText(/display name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const verifyPasswordInput = screen.getByLabelText(/verify password/i);
    const createButton = screen.getByRole('button', { name: /create account/i });

    expect(createButton).toBeDisabled();

    fireEvent.change(displayNameInput, { target: { value: 'New User' } });
    fireEvent.change(passwordInput, { target: { value: 'abc123' } });
    fireEvent.change(verifyPasswordInput, { target: { value: 'zzz999' } });
    expect(createButton).toBeDisabled();

    fireEvent.change(verifyPasswordInput, { target: { value: 'abc123' } });
    expect(createButton).toBeEnabled();
  });
});
