'use client';


import { Point } from '@/src/Point';
import { HexCoordinate } from '@/src/HexCoordinate';
import { HexDirection, move } from '@/src/HexDirection';
import { TerrainMap } from '@/src/TerrainMap';
import { defaultStyle } from '@/src/TerrainMapEditor';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Box, Button, Flex, HStack, Icon, IconButton, Input, Portal, Text, VStack } from '@chakra-ui/react';
import { toaster, Toaster } from '@/components/ui/toaster';
import { LuArrowDownLeft, LuArrowDownRight, LuArrowLeft, LuArrowRight, LuArrowUpLeft, LuArrowUpRight, LuCircleHelp, LuHouse, LuZoomIn, LuZoomOut } from 'react-icons/lu';
import { io, Socket } from "socket.io-client";
import { PORT, PotentialHexCoordinate } from '@/src/network';
import { HexBoard } from '@/components/HexBoard';
import TerrainLegend from '@/components/TerrainLegend';
import { LightDarkToggleButton } from '@/components/LightDarkToggleButton';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ChatMessage = {
  id: number;
  sender: string;
  avatar: string;
  text: string;
  own: boolean;
};

function avatarSizeForHexSize(hexSize: number): AvatarSize {
  if (hexSize <= 25) return 'xs';
  if (hexSize <= 50) return 'sm';
  return '2xl';
}

// Fudge offsets to visually center the avatar on the hex cell, per avatar size
const AVATAR_FUDGE: Record<AvatarSize, Point> = {
  'xs': { x: -10, y: 75 },
  'sm': { x: -13, y: 70 },
  'md': { x: -18, y: 38 },
  'lg': { x: -20, y: 44 },
  'xl': { x: -22, y: 50 },
  '2xl': { x: -25, y: 55 },
};

function avatarPosition(width: number, height: number, loc: HexCoordinate, center: HexCoordinate, size: number): Point {
  const relative = new HexCoordinate(loc.a - center.a, loc.b - center.b);
  const p = relative.toPoint();
  const fudge = AVATAR_FUDGE[avatarSizeForHexSize(size)];
  return {
    x: p.x * size + width / 2 + fudge.x,
    y: p.y * size + height / 2 + fudge.y,
  };
}

export default function Page() {
  const router = useRouter();
  const style = defaultStyle;

  const id = useSearchParams().get('id') || '';
  const user = useSearchParams().get('user') || '';
  // wsPort is read inside the socket effect from window.location to avoid SSR stale-value issues
  const [validatedMapID, setValidatedMapID] = useState('');
  const [validatedUserID, setValidatedUserID] = useState('');
  const [terrainMap, setTerrainMap] = useState<TerrainMap>(new TerrainMap());

  const socketRef = useRef<Socket | null>(null);
  const [userInfo, setUserInfo] = useState<{ [user: string]: { name: string, avatar: string } }>({});
  const [userLocn, setUserLocn] = useState<{ [user: string]: HexCoordinate }>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const nextChatIdRef = useRef(1);
  const pendingChatTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const userInfoRef = useRef(userInfo);
  const isMountedRef = useRef(true);
  useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);
  // The pending chat timer is cleared on unmount to avoid showing
  // a leftover 'chat failed to send' toast after the component is removed.
  // NOTE: if the `id` or `user` query changes while this component
  // remains mounted, the socket effect tears down and recreates the
  // socket but this cleanup runs only on unmount. In that case a
  // pending timeout from the previous chat context could still fire
  // and surface an error toast for the prior user/map. Consider also
  // clearing the pending timeout whenever the socket/chat key
  // (e.g. `id:user`) changes in addition to unmount to avoid
  // showing failures for a stale chat context.
  useEffect(() => () => {
    isMountedRef.current = false;
    if (pendingChatTimeoutRef.current) {
      globalThis.clearTimeout(pendingChatTimeoutRef.current);
      pendingChatTimeoutRef.current = null;
    }
  }, []);
  const validID = id !== '' && validatedMapID === id;
  const validUser = user !== '' && validatedUserID === user;
  const chatEnabled = validID && validUser;
  // const [chatAvailable, setChatAvailable] = useState(true);

  // useEffect(() => {
  //   setChatAvailable(true);
  // }, [id, user]);
  const [chatUnavailableFor, setChatUnavailableFor] = useState('');

  const chatKey = `${id}:${user}`;

  const chatAvailable = chatUnavailableFor !== chatKey;

  // const canSendChat = chatEnabled && socketConnected;
  const canSendChat = chatEnabled && chatAvailable && socketConnected;

  // toast helper
  const showChatServerError = useCallback((message?: string) => {
    if (!isMountedRef.current) return;
    toaster.create({
      id: 'chat-error',
      title: 'Chat Unavailable',
      description: message ?? 'Unable to connect to server - chat is disabled.',
      type: 'error',
      duration: 600000, // keep the error visible for 10 minutes
    });

    setChatUnavailableFor(chatKey);
    setChatOpen(false);
    setSocketConnected(false);
  }, [chatKey]);

  const [canvasWidth, setCanvasWidth] = useState(500);
  const [canvasHeight, setCanvasHeight] = useState(300);
  // center = server-confirmed position of the logged-in user (used for attemptMove)
  const [center, setCenter] = useState(new HexCoordinate(0, 0));
  // viewCenter = what the HexBoard is currently showing (panning moves this independently)
  const [viewCenter, setViewCenter] = useState(new HexCoordinate(0, 0));
  const MIN_SIZE = 25;
  const MAX_SIZE = 200;
  const [size, setSize] = useState(100);

  const boardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const doResize = () => {
      const HEIGHTFUDGE = 150; // height of the tool bars
      const WIDTHFUDGE = 10; // Space for outline etc
      const w = window.innerWidth - WIDTHFUDGE;
      const h = window.innerHeight - HEIGHTFUDGE;
      // console.log('resizing #1', w, h);
      setCanvasWidth(w);
      setCanvasHeight(h);
    }
    window.addEventListener('resize', doResize);
    doResize();
    return () => {
      window.removeEventListener('resize', doResize);
    }
  }, []);

  function errorMessage(msg: string) {
    toaster.create({
      title: 'Error',
      description: msg,
      type: 'error'
    });
  }

  useEffect(() => {
    async function fetchMap() {
      if (id === '' || encodeURIComponent(id) !== id) {
        setValidatedMapID('');
        return;
      }
      const response = await fetch(`/api/map/${id}`);
      if (response.ok) {
        const obj = await response.json();
        const tm = new TerrainMap(obj);
        setValidatedMapID(id);
        setTerrainMap(tm);
      } else {
        setValidatedMapID('');
        const text = await response.text();
        errorMessage('Error fetching map:' + text);
      }
    }
    fetchMap();
  }, [id]);

  useEffect(() => {
    async function fetchUser() {
      if (user === '' || encodeURIComponent(user) !== user) {
        setValidatedUserID('');
        return;
      }
      const response = await fetch(`/api/user/${user}`);
      if (response.ok) {
        setValidatedUserID(user);
      } else {
        setValidatedUserID('');
        const text = await response.text();
        errorMessage('Error fetching user:' + text);
      }
    }
    fetchUser();
  }, [user]);

  useEffect(() => {
    if (!validID || !validUser) return;
    const wsPort = new URLSearchParams(window.location.search).get('wsPort') || String(PORT);
    const wsOrigin = `${window.location.protocol}//${window.location.hostname}:${wsPort}`;
    const socket = io(`${wsOrigin}/${id}`, {
      query: {
        id: user
      }
    });
    socket.on('connect', () => {
      console.log('Connected to server');
      toaster.dismiss('chat-error');
      setChatUnavailableFor('');
      if (isMountedRef.current) setSocketConnected(true);
    });
    socket.on('connect_error', () => {
      console.log('Cannot connect to server');
      showChatServerError('Unable to connect to server - chat is disabled.');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      showChatServerError('Disconnected from server - chat is disabled.');
    });

    socket.on('chat_error', (message?: string) => {
      console.log('Server reject message:', message);
      showChatServerError(message ? `Message rejected by server: ${message}` : 'Chat message rejected by server - chat is disabled.');
    });

    socket.on('user', (userID: string, action: string | PotentialHexCoordinate) => {
      if (typeof action === 'string') {
        if (action !== 'exit') {
          console.error('Unknown user action: ' + action);
          return;
        }
        console.log('User ' + userID + ' has exited');
        setUserLocn((prev) => {
          const newState = { ...prev };
          delete newState[userID];
          return newState;
        });
        setUserInfo((prev) => {
          const newState = { ...prev };
          delete newState[userID];
          return newState;
        });
      } else if (typeof action.a === 'number' && typeof action.b === 'number') {
        const loc = new HexCoordinate(action.a, action.b)
        console.log('User ' + userID + ' has moved to ' + loc.toString());
        setUserLocn((prev) => {
          const newState = { ...prev };
          newState[userID] = loc;
          return newState;
        });
        if (userID === user) {
          setCenter(loc);
          setViewCenter(loc); // re-center view on confirmed position after a real move
        }
      } else {
        console.error('Unknown user action: ' + action);
        return;
      }
    });
    socket.on('error', (error: string) => {
      errorMessage('Movement error: ' + error);
    });
    const handleChat = (fromUser: string, payload: string | { message?: string }) => {
      const message = typeof payload === 'string' ? payload : payload?.message;
      if (typeof message !== 'string' || message.trim() === '') return;
      if (!isMountedRef.current) return;
      if (fromUser === user && pendingChatTimeoutRef.current) {
        globalThis.clearTimeout(pendingChatTimeoutRef.current);
        pendingChatTimeoutRef.current = null;
      }
      const knownUser = userInfoRef.current[fromUser];
      setChatMessages((prev) => [
        ...prev,
        {
          id: nextChatIdRef.current++,
          sender: knownUser?.name || fromUser || 'Visitor',
          avatar: knownUser?.avatar || '',
          text: message,
          own: fromUser === user,
        }
      ]);
    };
    socket.on('chat', handleChat);
    socketRef.current = socket;
    if (socket.connected) {
      queueMicrotask(() => {
        if (isMountedRef.current) setSocketConnected(true);
      });
    }
    return () => {
      socket.off('chat', handleChat);
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('chat_error');
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [id, user, validID, validUser, chatEnabled, showChatServerError]);

  useEffect(() => {
    async function lookupUser(userID: string) {
      setUserInfo((prev) => {
        const newState = { ...prev };
        newState[userID] = { name: 'Anonymous User', avatar: '' };
        return newState;
      });
      const response = await fetch(`/api/user/${userID}`);
      if (response.ok) {
        const obj = await response.json();
        setUserInfo((prev) => {
          const newState = { ...prev };
          newState[userID] = obj;
          return newState;
        });
      } else {
        const text = await response.text();
        errorMessage('Error fetching user:' + text);
      }
    }
    for (const userID in userLocn) {
      if (userID in userInfo) continue;
      lookupUser(userID);
    }
  }, [userLocn, userInfo])

  useEffect(() => {
    const entries = Object.entries(userLocn);
    if (entries.length === 0) return;
    console.log('Current user locations:');
    for (const [userID, loc] of entries) {
      console.log(`  ${userID}: (${loc.a}, ${loc.b})`);
    }
  }, [userLocn]);

  const attemptMove = useCallback((d: HexDirection) => {
    socketRef.current?.emit('move', move(center, d));
  }, [center]);

  const centerRef = useRef(center);
  useEffect(() => { centerRef.current = center; }, [center]);
  const viewCenterRef = useRef(viewCenter);
  useEffect(() => { viewCenterRef.current = viewCenter; }, [viewCenter]);
  const sizeRef = useRef(size);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const displayCenter = useMemo(() => {
    if (dragOffset.x === 0 && dragOffset.y === 0) return viewCenter;
    const cp = viewCenter.toPoint();
    return HexCoordinate.fromPoint({
      x: cp.x - dragOffset.x / size,
      y: cp.y - dragOffset.y / size,
    });
  }, [viewCenter, dragOffset, size]);

  useEffect(() => {
    const boardDiv = boardRef.current;
    if (!boardDiv) return;

    const handleMouseDown = (e: MouseEvent) => {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setDragOffset({ x: 0, y: 0 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !(e.buttons & 1)) return;
      setDragOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const commitDrag = (clientX: number, clientY: number) => {
      if (!dragStartRef.current) return;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      dragStartRef.current = null;
      if (dx === 0 && dy === 0) return;
      const cp = viewCenterRef.current.toPoint();
      const snapped = HexCoordinate.fromPoint({
        x: cp.x - dx / sizeRef.current,
        y: cp.y - dy / sizeRef.current,
      }).round();
      setViewCenter(snapped); // only move the view, not the user's actual position
      setDragOffset({ x: 0, y: 0 });
    };

    const handleMouseUp = (e: MouseEvent) => commitDrag(e.clientX, e.clientY);
    const handleMouseLeave = (e: MouseEvent) => commitDrag(e.clientX, e.clientY);

    boardDiv.addEventListener('mousedown', handleMouseDown);
    boardDiv.addEventListener('mousemove', handleMouseMove);
    boardDiv.addEventListener('mouseup', handleMouseUp);
    boardDiv.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      boardDiv.removeEventListener('mousedown', handleMouseDown);
      boardDiv.removeEventListener('mousemove', handleMouseMove);
      boardDiv.removeEventListener('mouseup', handleMouseUp);
      boardDiv.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [boardRef]);

  useEffect(() => {
    const boardDiv = boardRef.current;
    if (!boardDiv) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setSize((s) =>
        e.deltaY < 0
          ? Math.min(s + 25, MAX_SIZE)
          : Math.max(s - 25, MIN_SIZE)
      );
    };
    boardDiv.addEventListener('wheel', handleWheel, { passive: false });
    return () => boardDiv.removeEventListener('wheel', handleWheel);
  }, [boardRef, MIN_SIZE, MAX_SIZE]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: HexDirection } = {
        Numpad4: HexDirection.WEST,
        Numpad6: HexDirection.EAST,
        Numpad7: HexDirection.NORTHWEST,
        Numpad9: HexDirection.NORTHEAST,
        Numpad1: HexDirection.SOUTHWEST,
        Numpad3: HexDirection.SOUTHEAST,
        Left: HexDirection.WEST,
        ArrowLeft: HexDirection.WEST,
        Right: HexDirection.EAST,
        ArrowRight: HexDirection.EAST
        // Up: HexDirection.NORTHEAST, // prefer NE/NW for up since they show more map
        // ArrowUp: HexDirection.NORTHEAST,
        // Down: HexDirection.SOUTHWEST,
        // ArrowDown: HexDirection.SOUTHWEST,
      };
      const dir = keyMap[e.code];
      if (dir !== undefined) {
        e.preventDefault();
        attemptMove(dir);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attemptMove]);

  function sendChatMessage() {
    const message = chatInput.trim();

    if (message === '') return;

    // Prevents sending knowing server is unavailable - no error thrown by server
    if (!canSendChat || !socketRef.current) {
      toaster.create({
        title: 'Cannot Send Message',
        description: 'Not connected to the server - unable to send message.',
        type: 'error',
        duration: 600000, // keep the error visible for 10 minutes
      });
      return;
    }

    if (pendingChatTimeoutRef.current) {
      globalThis.clearTimeout(pendingChatTimeoutRef.current);
      pendingChatTimeoutRef.current = null;
    }

    socketRef.current.emit('chat', message);
    setChatInput('');

    pendingChatTimeoutRef.current = globalThis.setTimeout(() => {
      pendingChatTimeoutRef.current = null;
      toaster.create({
        title: 'Chat failed to send',
        description: 'Unable to send message. Server may be unavailable.',
        type: 'error'
      });
    }, 5000);
  }

  return (
    <VStack>
      <Toaster />
      <HStack>
        <Text fontSize="2xl" fontWeight="bold">Hex Map</Text>
        <IconButton variant="surface" aria-label="home" size="sm"
          onClick={() => router.push('/')}
        >
          <LuHouse />
        </IconButton>
        <Link href="/help/visit" target="_blank" rel="noopener noreferrer">
          <Icon size={'lg'} color={'blue'}><LuCircleHelp /></Icon>
        </Link>
        <IconButton variant="surface" aria-label="move left" size="sm"
          onClick={() => attemptMove(HexDirection.WEST)}
        >
          <LuArrowLeft />
        </IconButton>
        <VStack>
          <IconButton variant="surface" aria-label='move up' size="sm"
            onClick={() => attemptMove(HexDirection.NORTHWEST)}
          >
            <LuArrowUpLeft />
          </IconButton>
          <IconButton variant="surface" aria-label='move down' size="sm"
            onClick={() => attemptMove(HexDirection.SOUTHWEST)}
          >
            <LuArrowDownLeft />
          </IconButton>
        </VStack>
        <VStack>
          <IconButton variant="surface" aria-label='move up' size="sm"
            onClick={() => attemptMove(HexDirection.NORTHEAST)}
          >
            <LuArrowUpRight />
          </IconButton>
          <IconButton variant="surface" aria-label='move down' size="sm"
            onClick={() => attemptMove(HexDirection.SOUTHEAST)}
          >
            <LuArrowDownRight />
          </IconButton>
        </VStack>
        <IconButton variant="surface" aria-label="move right" size="sm"
          onClick={() => attemptMove(HexDirection.EAST)}
        >
          <LuArrowRight />
        </IconButton>
        <TerrainLegend />
        <IconButton variant="surface" aria-label="zoom in" size="sm"
          onClick={() => setSize((s) => Math.min(s + 25, MAX_SIZE))}
          disabled={size >= MAX_SIZE}
        >
          <LuZoomIn />
        </IconButton>
        <IconButton variant="surface" aria-label="zoom out" size="sm"
          onClick={() => setSize((s) => Math.max(s - 25, MIN_SIZE))}
          disabled={size <= MIN_SIZE}
        >
          <LuZoomOut />
        </IconButton>
        <LightDarkToggleButton />
      </HStack>
      <Portal container={boardRef}>
        {
          Object.entries(userLocn).map(([userID, loc]) => {
            const pos = avatarPosition(canvasWidth, canvasHeight, loc, displayCenter, size);
            console.log(`[debug] user=${userID} hex=(${loc.a},${loc.b}) pixel=(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) displayCenter=(${displayCenter.a.toFixed(2)},${displayCenter.b.toFixed(2)})`);
            return (
              <Avatar.Root key={userID} size={avatarSizeForHexSize(size)} style={{ position: 'absolute', left: pos.x + 'px', top: pos.y + 'px' }}>
                <Avatar.Image src={userInfo[userID]?.avatar || undefined} />
                <Avatar.Fallback name={userInfo[userID]?.name || 'Anonymous User'} />
              </Avatar.Root>
            );
          })
        }
      </Portal>
      <div ref={boardRef} style={{ cursor: dragOffset.x !== 0 || dragOffset.y !== 0 ? 'grabbing' : 'grab' }}>
        <HexBoard
          width={canvasWidth}
          height={canvasHeight}
          center={displayCenter}
          map={terrainMap}
          style={style}
          hexSize={size}
        /></div>
      {chatEnabled && chatAvailable ? (
        <Box position="fixed" right={4} bottom={4} zIndex={30} width={{ base: 'calc(100vw - 2rem)', md: '24rem' }}>
          {chatOpen ? (
            <Flex direction="column" border="1px solid" borderColor="gray.200" borderRadius="md" bg="white" shadow="lg">
              <Box
                as="button"
                aria-label="Minimize chat room"
                p={3}
                shadow="sm"
                borderBottom="1px solid"
                borderColor="gray.200"
                fontWeight="semibold"
                cursor="pointer"
                onClick={() => setChatOpen(false)}
              >
                Chat Room
              </Box>
              <VStack flex={1} align="stretch" gap={3} maxH="240px" overflowY="auto" p={3}>
                {chatMessages.length === 0 ? (
                  <Text color="gray.500">No messages yet.</Text>
                ) : (
                  chatMessages.map((message) => (
                    <HStack key={message.id} alignSelf={message.own ? 'flex-end' : 'flex-start'} data-own={message.own ? 'true' : 'false'}>
                      {!message.own ? (
                        <Avatar.Root size="sm">
                          <Avatar.Image src={message.avatar || undefined} />
                          <Avatar.Fallback name={message.sender} />
                        </Avatar.Root>
                      ) : null}
                      <Text bg={message.own ? 'blue.100' : 'gray.100'} p={2} borderRadius="md">
                        {message.text}
                      </Text>
                      {message.own ? (
                        <Avatar.Root size="sm">
                          <Avatar.Image src={message.avatar || undefined} />
                          <Avatar.Fallback name={message.sender} />
                        </Avatar.Root>
                      ) : null}
                    </HStack>
                  ))
                )}
              </VStack>
              <HStack p={3} borderTop="1px solid" borderColor="gray.200">
                <Input
                  placeholder="Type a message..."
                  value={chatInput}
                  disabled={!canSendChat}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChatMessage();
                  }}
                />
                <Button colorPalette="blue" disabled={!canSendChat} onClick={sendChatMessage}>Send</Button>
              </HStack>
            </Flex>
          ) : (
            <Box
              as="button"
              aria-label="Open chat room"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              shadow="md"
              p={3}
              fontWeight="semibold"
              textAlign="center"
              cursor="pointer"
              onClick={() => setChatOpen(true)}
            >
              Chat Room
            </Box>
          )}
        </Box>
      ) : null}
      <HStack>
        <Text fontSize="lg">ID: {id}</Text>
        <Text fontSize="lg">User: {user}</Text>
        <Link href="/help/visit" target="_blank" rel="noopener noreferrer">
          <Icon size={'lg'}><LuCircleHelp /></Icon>
        </Link>
      </HStack>
    </VStack>
  );
}
