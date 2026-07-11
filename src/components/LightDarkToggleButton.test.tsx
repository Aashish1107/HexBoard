/** @jest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LightDarkToggleButton from './LightDarkToggleButton';

const mockUseTheme = jest.fn();

jest.mock('@chakra-ui/react', () => ({
	ClientOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	IconButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type="button" {...props}>
			{children}
		</button>
	),
	Skeleton: () => <div />,
}));

jest.mock('next-themes', () => ({
	useTheme: () => mockUseTheme(),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LightDarkToggleButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function renderButton() {
		return render(<LightDarkToggleButton />);
	}

	it('renders the toggle button', async () => {
		mockUseTheme.mockReturnValue({
			resolvedTheme: 'light',
			setTheme: jest.fn(),
		});

		renderButton();

		expect(await screen.findByRole('button', { name: /toggle color mode/i })).toBeTruthy();
	});

	it('switches from light to dark when clicked', async () => {
		const setTheme = jest.fn();
		mockUseTheme.mockReturnValue({
			resolvedTheme: 'light',
			setTheme,
		});

		renderButton();
		fireEvent.click(await screen.findByRole('button', { name: /toggle color mode/i }));

		expect(setTheme).toHaveBeenCalledWith('dark');
	});

	it('switches from dark to light when clicked', async () => {
		const setTheme = jest.fn();
		mockUseTheme.mockReturnValue({
			resolvedTheme: 'dark',
			setTheme,
		});

		renderButton();
		fireEvent.click(await screen.findByRole('button', { name: /toggle color mode/i }));

		expect(setTheme).toHaveBeenCalledWith('light');
	});
});