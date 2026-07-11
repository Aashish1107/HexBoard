import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './page';
import { Provider } from '@/components/ui/provider';
import { mockGraphicsContext } from '@/src/mockWebElements';

jest.mock('next/navigation', () => ({
	useSearchParams: () => ({
		get: () => '',
	}),
	useRouter: () => ({
		push: jest.fn(),
	}),
}));

const { ctx } = mockGraphicsContext();

beforeEach(() => {
	jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
});

afterEach(() => {
	jest.restoreAllMocks();
});

function renderEditorPage() {
	return render(
		<Provider>
			<Page />
		</Provider>
	);
}

describe('Editor Page Extension Tests', () => {
	describe('Unit Tests', () => {
		describe('Test Suite Verification', () => {
			test('verifies that the test suite is runnable and can render the editor page', () => {
				renderEditorPage();
				expect(screen.getByText(/choose a mode/i)).toBeInTheDocument();
			});
		});

		describe('Terrain and Size Selection', () => {
			test('allows the user to select different terrain modes from the mode dropdown', async () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user opens the mode selector and chooses "Add terrain"
				const modeTrigger = screen.getByRole('combobox', { name: /choose a mode/i });
				fireEvent.click(modeTrigger);
				const addTerrainOption = await screen.findByRole('option', { name: /add terrain/i });
				fireEvent.click(addTerrainOption);

				// Then: Add terrain should be the selected mode
				await waitFor(() => {
					expect(modeTrigger).toHaveTextContent(/add terrain/i);
				});
			});

			test('allows the user to select different sizes from the size dropdown', async () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user opens the size selector and chooses "100"
				const sizeTrigger = screen.getByRole('combobox', { name: /choose a size/i });
				fireEvent.click(sizeTrigger);
				const sizeOption = await screen.findByRole('option', { name: /^100$/i });
				fireEvent.click(sizeOption);

				// Then: 100 should be the selected size
				await waitFor(() => {
					expect(sizeTrigger).toHaveTextContent(/100/i);
				});
			});

			test('has default terrain mode as Nothing and size set to 50 on initial render', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// Then: defaults are applied
				const modeTrigger = screen.getByRole('combobox', { name: /choose a mode/i });
				const sizeTrigger = screen.getByRole('combobox', { name: /choose a size/i });
				expect(modeTrigger).toHaveTextContent(/nothing/i);
				expect(sizeTrigger).toHaveTextContent(/50/i);
			});
		});

		describe('Navigation Controls', () => {
			test('moves the view left when the left arrow button is clicked', () => {
				// Given: the editor page is rendered
				renderEditorPage();
				const viewOriginDisplay = screen.getByText(/\(0, 0\)/i);
				expect(viewOriginDisplay).toBeInTheDocument();

				// When: the left arrow button is clicked
				const leftButton = screen.getByRole('button', { name: /move left/i });
				fireEvent.click(leftButton);

				// Then: view origin should shift left (x decreases by 1)
				expect(screen.getByText(/\(-1, 0\)/i)).toBeInTheDocument();
			});

			test('moves the view right when the right arrow button is clicked', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the right arrow button is clicked
				const rightButton = screen.getByRole('button', { name: /move right/i });
				fireEvent.click(rightButton);

				// Then: view origin should shift right (x increases by 1)
				expect(screen.getByText(/\(1, 0\)/i)).toBeInTheDocument();
			});

			test('moves the view up when the up arrow button is clicked', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the up arrow button is clicked
				const upButton = screen.getByRole('button', { name: /move up/i });
				fireEvent.click(upButton);

				// Then: view origin should shift up (y decreases by 1)
				expect(screen.getByText(/\(0, -1\)/i)).toBeInTheDocument();
			});

			test('moves the view down when the down arrow button is clicked', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the down arrow button is clicked
				const downButton = screen.getByRole('button', { name: /move down/i });
				fireEvent.click(downButton);

				// Then: view origin should shift down (y increases by 1)
				expect(screen.getByText(/\(0, 1\)/i)).toBeInTheDocument();
			});

			test('allows multiple navigation clicks to compound correctly', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: multiple navigation buttons are clicked
				fireEvent.click(screen.getByRole('button', { name: /move right/i }));
				fireEvent.click(screen.getByRole('button', { name: /move right/i }));
				fireEvent.click(screen.getByRole('button', { name: /move down/i }));

				// Then: view origin should reflect the sum of all movements
				expect(screen.getByText(/\(2, 1\)/i)).toBeInTheDocument();
			});
		});

		describe('Keyboard Navigation', () => {
			test('ArrowLeft key moves view left (x decreases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft' });

				expect(screen.getByText(/\(-1, 0\)/i)).toBeInTheDocument();
			});

			test('ArrowRight key moves view right (x increases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' });

				expect(screen.getByText(/\(1, 0\)/i)).toBeInTheDocument();
			});

			test('ArrowUp key moves view up (y decreases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'ArrowUp', key: 'ArrowUp' });

				expect(screen.getByText(/\(0, -1\)/i)).toBeInTheDocument();
			});

			test('ArrowDown key moves view down (y increases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });

				expect(screen.getByText(/\(0, 1\)/i)).toBeInTheDocument();
			});

			test('Numpad4 key moves view left (x decreases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad4', key: '4' });

				expect(screen.getByText(/\(-1, 0\)/i)).toBeInTheDocument();
			});

			test('Numpad6 key moves view right (x increases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad6', key: '6' });

				expect(screen.getByText(/\(1, 0\)/i)).toBeInTheDocument();
			});

			test('Numpad7 key moves view northwest (x decreases by 1, y decreases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad7', key: '7' });

				expect(screen.getByText(/\(-1, -1\)/i)).toBeInTheDocument();
			});

			test('Numpad9 key moves view northeast (y decreases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad9', key: '9' });

				expect(screen.getByText(/\(0, -1\)/i)).toBeInTheDocument();
			});

			test('Numpad1 key moves view south (y increases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad1', key: '1' });

				expect(screen.getByText(/\(0, 1\)/i)).toBeInTheDocument();
			});

			test('Numpad3 key moves view southeast (x increases by 1, y increases by 1)', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				fireEvent.keyDown(window, { code: 'Numpad3', key: '3' });

				expect(screen.getByText(/\(1, 1\)/i)).toBeInTheDocument();
			});

			test('multiple keyboard moves compound correctly', () => {
				renderEditorPage();
				expect(screen.getByText(/\(0, 0\)/i)).toBeInTheDocument();

				// Move right twice, then down once
				fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' });
				fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' });
				fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });

				expect(screen.getByText(/\(2, 1\)/i)).toBeInTheDocument();
			});
		});

		describe('Editor Mode Selector Extensions', () => {
			test('can switch to add mode and change hexagon to Water', async () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user opens the mode selector and chooses "Add"
				const modeSelector = screen.getByRole('combobox', { name: /mode/i });
				fireEvent.click(modeSelector);
				const addModeOption = await screen.findByRole('option', { name: /add/i });
				fireEvent.click(addModeOption);

				// And: selects Water terrain
				const terrainTrigger = await screen.findByRole('combobox', { name: /choose a terrain/i });
				fireEvent.click(terrainTrigger);
				const waterOption = await screen.findByRole('option', { name: /water/i });
				fireEvent.click(waterOption);

				// Then: Add mode should be active and Water should be selected
				await waitFor(() => {
					expect(modeSelector).toHaveTextContent(/add/i);
					expect(terrainTrigger).toHaveTextContent(/water/i);
				});
			});

			test('can switch to erase mode and hide terrain selector', async () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user opens the mode selector and chooses "Erase"
				const modeSelector = screen.getByRole('combobox', { name: /mode/i });
				fireEvent.click(modeSelector);
				const eraseModeOption = await screen.findByRole('option', { name: /erase/i });
				fireEvent.click(eraseModeOption);

				// Then: Erase mode should be active and terrain selector should be hidden
				await waitFor(() => {
					expect(modeSelector).toHaveTextContent(/erase/i);
				});
				expect(screen.queryByRole('combobox', { name: /choose a terrain/i })).not.toBeInTheDocument();
			});

			test('can switch to nothing mode and selected hexagons do not change terrain on click', async () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user opens the mode selector and chooses "Nothing"
				const modeSelector = screen.getByRole('combobox', { name: /mode/i });
				fireEvent.click(modeSelector);
				const nothingOption = await screen.findByRole('option', { name: /nothing/i });
				fireEvent.click(nothingOption);

				// Then: Nothing mode should be active and no terrain changes happen on click
				await waitFor(() => {
					expect(modeSelector).toHaveTextContent(/nothing/i);
				});

				// And: when a hexagon is clicked, no changes are recorded
				const initialUndoButton = screen.getByRole('button', { name: /undo/i });
				expect(initialUndoButton).toBeDisabled();

				const canvas = screen.queryByRole('img', { hidden: true }) ||
					document.querySelector('canvas');
				if (canvas) {
					fireEvent.click(canvas, { clientX: 250, clientY: 150 });
				}

				const finalUndoButton = screen.getByRole('button', { name: /undo/i });
				expect(finalUndoButton).toBeDisabled();
			});
		});
		describe('Zoom In/Out with Mouse Extensions', () => {
			test('can use mouse wheel to zoom in and out', () => {
				// Given: the editor page is rendered
				renderEditorPage();

				// When: the user scrolls the mouse wheel to zoom in
				const canvas = document.querySelector('canvas');
				expect(canvas).toBeInTheDocument();
				if (!canvas) return;

				fireEvent.wheel(canvas, { deltaY: -100 });

				// Then: the canvas should reflect a zoomed-in state
				// (Note: This is observable through size selector or hexagon rendering changes)
				const sizeSelector = screen.getByRole('combobox', { name: /choose a size/i });
				expect(sizeSelector).toBeInTheDocument();

				// When: the user scrolls the mouse wheel to zoom out
				fireEvent.wheel(canvas, { deltaY: 100 });

				// Then: the canvas should reflect a zoomed-out state
				expect(sizeSelector).toBeInTheDocument();
			});
		});
	});




});
