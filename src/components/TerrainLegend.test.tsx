import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TerrainLegend, { defaultItems } from './TerrainLegend';

function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${red}, ${green}, ${blue})`;
}

describe('TerrainLegend', () => {
  describe('Unit Tests', () => {
    test('toggles the terrain legend button - from off state to on state and back to off state', async () => {
      const user = userEvent.setup();
      render(<TerrainLegend />);

      // initial state - legend is not visible, button to show legend is visible
      const trigger = screen.getByRole('button', { name: /terrain legend/i });
      expect(screen.queryByRole('region', { name: /terrain legend/i })).not.toBeInTheDocument();

      // first click on button shows the terrain legend
      await user.click(trigger);
      expect(screen.getByRole('region', { name: /terrain legend/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide legend/i })).toBeInTheDocument();

      // second click on button hides the terrain legend
      await user.click(screen.getByRole('button', { name: /hide legend/i }));
      expect(screen.queryByRole('region', { name: /terrain legend/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /terrain legend/i })).toBeInTheDocument();
    });
  });

  describe('Integration Tests - Terrain Legend Display', () => {
    test('shows all terrain legend items when opened', () => {
      render(<TerrainLegend />);

      const legendButton = screen.getByRole('button', { name: /terrain legend/i });
      expect(legendButton).toBeInTheDocument();

      fireEvent.click(legendButton);

      expect(screen.getByRole('button', { name: /hide legend/i })).toBeInTheDocument();
      const legendPanel = screen.getByRole('region', { name: /terrain legend/i });
      ['Open', 'Water', 'Glass', 'Shrubbery', 'Curtain', 'Wall'].forEach((terrainName) => {
        expect(within(legendPanel).getByText(new RegExp(`^${terrainName}$`, 'i'))).toBeInTheDocument();
      });
    });

    test('closes when hide legend button is clicked', () => {
      render(<TerrainLegend />);
      const legendButton = screen.getByRole('button', { name: /terrain legend/i });
      fireEvent.click(legendButton);
      expect(screen.getByRole('region', { name: /terrain legend/i })).toBeInTheDocument();

      const hideButton = screen.getByRole('button', { name: /hide legend/i });
      fireEvent.click(hideButton);

      expect(screen.queryByRole('region', { name: /terrain legend/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /terrain legend/i })).toBeInTheDocument();
    });

    test('can be toggled open and closed multiple times', () => {
      render(<TerrainLegend />);
      const legendButton = screen.getByRole('button', { name: /terrain legend/i });

      fireEvent.click(legendButton);
      expect(screen.getByRole('region', { name: /terrain legend/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /hide legend/i }));
      expect(screen.queryByRole('region', { name: /terrain legend/i })).not.toBeInTheDocument();

      fireEvent.click(legendButton);
      expect(screen.getByRole('region', { name: /terrain legend/i })).toBeInTheDocument();

      const legendPanel = screen.getByRole('region', { name: /terrain legend/i });
      expect(within(legendPanel).getByText(/^Water$/i)).toBeInTheDocument();
    });

    test('displays color indicators for each terrain type', () => {
      render(<TerrainLegend />);

      const legendButton = screen.getByRole('button', { name: /terrain legend/i });
      fireEvent.click(legendButton);

      const legendPanel = screen.getByRole('region', { name: /terrain legend/i });
      defaultItems.forEach(({ label, color }) => {
        const listItem = within(legendPanel).getByText(new RegExp(`^${label}$`, 'i')).closest('li');
        expect(listItem).toBeInTheDocument();
        const swatch = listItem!.querySelector<HTMLElement>('[aria-hidden="true"]') ?? listItem!.querySelector<HTMLElement>('span, div');
        expect(swatch).toBeInTheDocument();
        expect(swatch).toHaveStyle({ background: hexToRgb(color) });
      });
    });
  });
});
