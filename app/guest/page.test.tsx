import { render, screen } from '@testing-library/react';
import { Provider } from '@/components/ui/provider';
import Page from './page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Guest Page', () => {
  test('renders the guest access form', () => {
    render(
      <Provider>
        <Page />
      </Provider>
    );

    expect(screen.getByText('Guest Access')).toBeInTheDocument();
    expect(screen.getByText(/no login required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter as guest/i })).toBeDisabled();
  });
});
