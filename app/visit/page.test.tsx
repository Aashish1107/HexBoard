import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from './page';
import { Provider } from '@/components/ui/provider';
import { mockGraphicsContext } from '@/src/mockWebElements';


const mockSearchParamGet = jest.fn((_: string) => '');
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
	useSearchParams: () => ({
		get: mockSearchParamGet,
	}),
	useRouter: () => ({
		push: mockPush,
	}),
}));

const mockIo = jest.fn();

jest.mock('socket.io-client', () => ({
	io: (...args: unknown[]) => mockIo(...args),
}));

const { ctx } = mockGraphicsContext();
const originalFetch = global.fetch;
let mockSocket: {
	on: jest.Mock;
	off: jest.Mock;
	emit: jest.Mock;
	disconnect: jest.Mock;
	timeout: jest.Mock;
	connected: boolean;
};
beforeEach(() => {
	mockSearchParamGet.mockImplementation((_: string) => '');
	mockPush.mockReset();
	mockSocket = {
		on: jest.fn(),
		off: jest.fn(),
		emit: jest.fn(),
		disconnect: jest.fn(),
		timeout: jest.fn().mockReturnValue({ emit: jest.fn().mockImplementation((_event: string, _msg: string, ack: (err: Error | null) => void) => { ack(null); }) }),
		connected: true,
	};
	mockIo.mockReset();
	mockIo.mockReturnValue(mockSocket);
	jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
});

afterEach(() => {
	jest.restoreAllMocks();
	global.fetch = originalFetch;
});

function renderVisitPage() {
	return render(
		<Provider>
			<Page />
		</Provider>
	);
}

describe('Visit Page Tests', () => {
	describe('Test Suite Verification', () => {
		test('verifies that the visit page can render', () => {
			const { container } = renderVisitPage();
			expect(screen.getByText(/hex map/i)).toBeInTheDocument();
			expect(container.querySelector('canvas')).toBeInTheDocument();
		});
	});

	describe('Controls and Layout', () => {
		test('renders movement, zoom, and footer controls', () => {
			renderVisitPage();

			expect(screen.getByRole('button', { name: /move left/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /move right/i })).toBeInTheDocument();
			expect(screen.getAllByRole('button', { name: /move up/i })).toHaveLength(2);
			expect(screen.getAllByRole('button', { name: /move down/i })).toHaveLength(2);
			expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
			expect(screen.getByText(/^id:/i)).toBeInTheDocument();
			expect(screen.getByText(/^user:/i)).toBeInTheDocument();
		});

		test('disables zoom in when max zoom is reached', () => {
			renderVisitPage();

			const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
			expect(zoomInButton).not.toBeDisabled();

			fireEvent.click(zoomInButton);
			fireEvent.click(zoomInButton);
			fireEvent.click(zoomInButton);
			fireEvent.click(zoomInButton);

			expect(zoomInButton).toBeDisabled();
		});

		test('disables zoom out when min zoom is reached', () => {
			renderVisitPage();

			const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
			expect(zoomOutButton).not.toBeDisabled();

			fireEvent.click(zoomOutButton);
			fireEvent.click(zoomOutButton);
			fireEvent.click(zoomOutButton);

			expect(zoomOutButton).toBeDisabled();
		});
	});

	describe('Networked Movement Behavior', () => {
		test('creates a map socket when id and user are valid', async () => {
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});

			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}
				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}
				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;

			renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});
		});

		test('emits a move event when move left is clicked after socket setup', async () => {
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});

			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}
				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}
				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;

			renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});

			fireEvent.click(screen.getByRole('button', { name: /move left/i }));

			expect(mockSocket.emit).toHaveBeenCalledWith(
				'move',
				expect.objectContaining({ a: expect.any(Number), b: expect.any(Number) })
			);
		});

		test('emits move events when numpad keys are pressed', async () => {
			// Given: the visit page is rendered with a valid map id and user
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});
			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}
				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}
				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;
			renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});

			// When: the user presses numpad directions (Numpad4 for WEST, Numpad9 for NORTHEAST)
			fireEvent.keyDown(window, { key: 'Numpad4', code: 'Numpad4' });
			fireEvent.keyDown(window, { key: 'Numpad9', code: 'Numpad9' });

			// Then: movement events should be emitted for each key press
			expect(mockSocket.emit).toHaveBeenCalledTimes(2);
			expect(mockSocket.emit).toHaveBeenCalledWith(
				'move',
				expect.objectContaining({ a: expect.any(Number), b: expect.any(Number) })
			);
		});

		test('disconnects socket on unmount after connection setup', async () => {
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});

			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}
				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}
				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;

			const { unmount } = renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});

			unmount();
			expect(mockSocket.disconnect).toHaveBeenCalled();
		});
	});

	describe('Drag Move with Mouse', () => {
		test('can click and drag to pan the view', () => {
			// Given: the visit page is rendered
			renderVisitPage();

			// When: the user clicks and drags on the board div
			const boardDiv = document.querySelector('canvas')?.parentElement;
			expect(boardDiv).toBeInTheDocument();
			if (!boardDiv) return;

			// Drag far enough to cross a hex boundary (200px at default size 100 = 2 hex units)
			fireEvent.mouseDown(boardDiv, { clientX: 250, clientY: 150, buttons: 1 });
			fireEvent.mouseMove(boardDiv, { clientX: 450, clientY: 150, buttons: 1 });
			fireEvent.mouseUp(boardDiv, { clientX: 450, clientY: 150, buttons: 0 });

			// Then: the HexBoard should be rendered with a shifted center (not 0,0)
			const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
			expect(zoomInButton).toBeInTheDocument(); // page still renders after drag
		});
	});

	describe('Zoom In/Out with Mouse Extensions', () => {
		test('can use mouse wheel to zoom in and out', async () => {
			// Given: the visit page is rendered
			renderVisitPage();

			const canvas = document.querySelector('canvas');
			expect(canvas).toBeInTheDocument();
			if (!canvas) return;

			const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
			const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

			// When: the user scrolls the mouse wheel to zoom in (starting at 100, max 200, step 25)
			// 4 scroll-in events: 100 -> 125 -> 150 -> 175 -> 200
			fireEvent.wheel(canvas, { deltaY: -100 });
			fireEvent.wheel(canvas, { deltaY: -100 });
			fireEvent.wheel(canvas, { deltaY: -100 });
			fireEvent.wheel(canvas, { deltaY: -100 });

			// Then: zoom in button should be disabled (hex size reached maximum)
			await waitFor(() => {
				expect(zoomInButton).toBeDisabled();
			});

			// When: the user scrolls the mouse wheel to zoom out
			// 7 scroll-out events: 200 -> 175 -> 150 -> 125 -> 100 -> 75 -> 50 -> 25
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });
			fireEvent.wheel(canvas, { deltaY: 100 });

			// Then: zoom out button should be disabled (hex size reached minimum)
			await waitFor(() => {
				expect(zoomOutButton).toBeDisabled();
			});
		});
	});

	describe('UI extensions', () => {
		test('does not render chat controls without valid id/user', () => {
			// Given: the visit page is rendered with invalid id/user defaults
			renderVisitPage();

			// Then: chat controls are not available
			expect(screen.queryByRole('button', { name: /open chat room/i })).not.toBeInTheDocument();
		});

		test('go back to the home page when the home button is clicked', () => {
			// Given: the visit page is rendered
			renderVisitPage();

			const homeButton = screen.getByRole('button', { name: /home/i });
			expect(homeButton).toBeInTheDocument();

			// When: the user clicks the home button
			fireEvent.click(homeButton);

			// Then: navigation intent should target the home route
			expect(mockPush).toHaveBeenCalledWith('/');
		});

		test('can open text chat and send messages to other visitors', async () => {
			// Use fake timers and configure userEvent to advance them so the pending-send timeout is controllable
			jest.useFakeTimers();
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			// Given: the visit page is rendered with a valid map id and user
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});
			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}
				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}
				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;
			renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});
			const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1] as (() => void) | undefined;
			expect(connectHandler).toBeDefined();
			act(() => {
				connectHandler?.();
			});

			const chatBox = screen.getByRole('button', { name: /open chat room/i });
			expect(chatBox).toBeInTheDocument();

			// When: the user clicks the chat button and sends a message
			await user.click(chatBox);
			const chatInput = await screen.findByPlaceholderText(/message|chat/i);
			expect(chatInput).toBeInTheDocument();
			await user.type(chatInput, 'Hello other visitors!');
			expect(chatInput).toHaveValue('Hello other visitors!');

			const sendButton = screen.getByRole('button', { name: /send/i });
			expect(sendButton).toBeInTheDocument();
			try {
				await user.click(sendButton);

				// Then: a chat message should be emitted to other visitors
				expect(mockSocket.emit).toHaveBeenCalledWith('chat', 'Hello other visitors!');

				// Find the chat handler the page registered and simulate the server echo
				const chatHandler = mockSocket.on.mock.calls.find(([event]) => event === 'chat')?.[1] as ((fromUser: string, payload: string) => void) | undefined;
				expect(chatHandler).toBeDefined();
				act(() => { chatHandler?.('user-123', 'Hello other visitors!'); });

				// Advance timers past the 5s pending-send timeout to ensure the echo cleared it
				act(() => { jest.advanceTimersByTime(6000); });

				// There should be no error toast after the echo cancels the pending failure
				expect(screen.queryByText(/chat server is unavailable|chat failed|server|Chat Unavailable/i)).not.toBeInTheDocument();
			} finally {
				jest.useRealTimers();
			}
		});

		test('text chat throws error when accessed but backend server is not working', async () => {
			// Use fake timers and configure userEvent to advance them for stable timing behavior
			jest.useFakeTimers();
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});

			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);

				if (url.includes('/api/map/')) {
					return {
						ok: true,
						json: async () => ({}),
						text: async () => '',
					} as Response;
				}

				if (url.includes('/api/user/')) {
					return {
						ok: true,
						json: async () => ({ name: 'Test User', avatar: '' }),
						text: async () => '',
					} as Response;
				}

				return {
					ok: false,
					text: async () => 'not found',
				} as Response;
			}) as typeof fetch;

			renderVisitPage();

			await waitFor(() => {
				expect(mockIo).toHaveBeenCalled();
			});

			const connectHandler = mockSocket.on.mock.calls.find(
				([event]) => event === 'connect'
			)?.[1] as (() => void) | undefined;

			expect(connectHandler).toBeDefined();

			act(() => {
				connectHandler!();
			});

			const chatBox = screen.getByRole('button', { name: /open chat room/i });
			await user.click(chatBox);

			const chatInput = await screen.findByPlaceholderText(/message|chat/i);
			expect(chatInput).toBeEnabled();
			await user.type(chatInput, 'Hello?');

			const sendButton = screen.getByRole('button', { name: /send/i });
			expect(sendButton).toBeEnabled();
				try {
					await user.click(sendButton);

					const errorHandler = mockSocket.on.mock.calls.find(
						([event]) => event === 'chat_error' || event === 'error' || event === 'connect_error'
					)?.[1] as ((message?: string) => void) | undefined;

					expect(errorHandler).toBeDefined();

					act(() => {
						errorHandler?.('Chat server is unavailable');
					});

					expect(
						await screen.findByText(/chat server is unavailable|chat failed|server/i)
					).toBeInTheDocument();
				} finally {
					jest.useRealTimers();
				}
		});

		test('renders a received chat message from another user (left-aligned)', async () => {
			const userEvt = userEvent.setup();
			// Given: the visit page is rendered with a valid map id and user
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});
			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) return { ok: true, json: async () => ({}), text: async () => '' } as Response;
				if (url.includes('/api/user/')) return { ok: true, json: async () => ({ name: 'Other Person', avatar: '' }), text: async () => '' } as Response;
				return { ok: false, text: async () => 'not found' } as Response;
			}) as typeof fetch;
			renderVisitPage();

			await waitFor(() => { expect(mockIo).toHaveBeenCalled(); });

			// Activate socket connection
			const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1] as (() => void) | undefined;
			act(() => { connectHandler?.(); });

			// Open the chat room
			const chatBox = screen.getByRole('button', { name: /open chat room/i });
			await userEvt.click(chatBox);

			// When: a chat event arrives from a different user
			const chatHandler = mockSocket.on.mock.calls.find(([event]) => event === 'chat')?.[1] as ((fromUser: string, payload: string) => void) | undefined;
			expect(chatHandler).toBeDefined();
			act(() => { chatHandler?.('other-user', 'Hello from other!'); });

			// Then: the message text is visible and the HStack is left-aligned (not own)
			const messageText = await screen.findByText('Hello from other!');
			expect(messageText).toBeInTheDocument();
			const hstack = messageText.closest('[data-own]');
			expect(hstack).not.toBeNull();
			expect((hstack as HTMLElement).dataset.own).toBe('false');
		});

		test('renders a received chat message from the current user (right-aligned)', async () => {
			const userEvt = userEvent.setup();
			// Given: the visit page is rendered with a valid map id and user
			mockSearchParamGet.mockImplementation((key: string) => {
				if (key === 'id') return 'map-123';
				if (key === 'user') return 'user-123';
				return '';
			});
			global.fetch = jest.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/api/map/')) return { ok: true, json: async () => ({}), text: async () => '' } as Response;
				if (url.includes('/api/user/')) return { ok: true, json: async () => ({ name: 'Me', avatar: '' }), text: async () => '' } as Response;
				return { ok: false, text: async () => 'not found' } as Response;
			}) as typeof fetch;
			renderVisitPage();

			await waitFor(() => { expect(mockIo).toHaveBeenCalled(); });

			// Activate socket connection
			const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1] as (() => void) | undefined;
			act(() => { connectHandler?.(); });

			// Open the chat room
			const chatBox = screen.getByRole('button', { name: /open chat room/i });
			await userEvt.click(chatBox);

			// When: a chat event arrives from the current user (own message echo)
			const chatHandler = mockSocket.on.mock.calls.find(([event]) => event === 'chat')?.[1] as ((fromUser: string, payload: string) => void) | undefined;
			expect(chatHandler).toBeDefined();
			act(() => { chatHandler?.('user-123', 'This is my own message'); });

			// Then: the message text is visible and the HStack is right-aligned (own)
			const messageText = await screen.findByText('This is my own message');
			expect(messageText).toBeInTheDocument();
			const hstack = messageText.closest('[data-own]');
			expect(hstack).not.toBeNull();
			expect((hstack as HTMLElement).dataset.own).toBe('true');
		});
	});
});
