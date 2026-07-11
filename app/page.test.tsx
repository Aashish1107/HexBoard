import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from './page';
import { Provider } from '@/components/ui/provider';

const mockUseTheme = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}));

jest.mock('next-themes', () => ({
	useTheme: () => mockUseTheme(),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Home Light/Dark toggle', () => {
	const originalStructuredClone = global.structuredClone;

	beforeAll(() => {
		global.structuredClone = function (obj: unknown) {
			if (obj === undefined) return undefined;
			return JSON.parse(JSON.stringify(obj));
		};
	});

	afterAll(() => {
		global.structuredClone = originalStructuredClone;
	});

	function renderPage() {
		return render(
			<Provider>
				<Page />
			</Provider>
		);
	}

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the home page content', () => {
		mockUseTheme.mockReturnValue({
			resolvedTheme: 'light',
			setTheme: jest.fn(),
		});
		renderPage();

		expect(screen.getByText('HexBoard')).toBeInTheDocument();
		expect(screen.getByText('Enter your name.')).toBeInTheDocument();
	});
});
