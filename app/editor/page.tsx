'use client';

import { HexCoordinate } from '@/src/HexCoordinate';
import { Terrain } from '@/src/Terrain';
import { TerrainMap } from '@/src/TerrainMap';
import { defaultStyle, DEFAULT_FILENAME } from '@/src/TerrainMapEditor';
import { Command, Log, removeTerrainCommand, sequenceCommand, setTerrainCommand } from '@/src/TerrainMapCommand';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Center, CloseButton, createListCollection, Dialog, HStack, IconButton, Input, Portal, Select, Text, VStack } from '@chakra-ui/react';
import { toaster, Toaster } from '@/components/ui/toaster';
import { LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuChevronDown, LuHouse, LuZoomIn, LuZoomOut } from 'react-icons/lu';
import TerrainLegend from '@/components/TerrainLegend';
import { LightDarkToggleButton } from '@/components/LightDarkToggleButton';

const terrainList = createListCollection({
  items: [
    { value: 'Open', label: 'Open' },
    { value: 'Wall', label: 'Wall' },
    { value: 'Water', label: 'Water' },
    { value: 'Glass', label: 'Glass' },
    { value: 'Shrubbery', label: 'Shrubbery' },
    { value: 'Curtain', label: 'Curtain' },
  ],
  itemToString: (item) => `${item.label}`,
  itemToValue: (item) => item.value
});

const terrainModeList = createListCollection({
  items: [
    { value: 'nothing', label: 'Nothing' },
    { value: 'erase', label: 'Erase' },
    { value: 'add-terrain', label: 'Add terrain' },
  ],
  itemToString: (item) => `${item.label}`,
  itemToValue: (item) => item.value
});

const sizeList = createListCollection({
  items: [
    { value: 10, label: '10' },
    { value: 15, label: '15' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
    { value: 75, label: '75' },
    { value: 100, label: '100' },
    { value: 150, label: '150' },
    { value: 250, label: '250' },
  ],
  itemToString: (item) => `${item.label}`,
  itemToValue: (item) => '' + item.value
});

const sizeValues = sizeList.items.map((item) => item.value as number);
const MIN_SIZE = sizeValues[0];
const MAX_SIZE = sizeValues[sizeValues.length - 1];
function nextSize(s: number): number {
  return sizeValues.find((v) => v > s) ?? MAX_SIZE;
}
function prevSize(s: number): number {
  return [...sizeValues].reverse().find((v) => v < s) ?? MIN_SIZE;
}

export default function Page() {
  const router = useRouter();
  const style = defaultStyle;

  const id = useSearchParams().get('id') || '';
  const [validID, setValidID] = useState('not valid');
  const [terrainMap, setTerrainMap] = useState<TerrainMap>(new TerrainMap());

  function errorMessage(msg: string) {
    toaster.create({
      title: 'Error',
      description: msg,
      type: 'error'
    });
  }

  useEffect(() => {
    async function fetchMap() {
      if (id === '' || encodeURIComponent(id) !== id) return;
      const response = await fetch(`/api/map/${id}`);
      if (response.ok) {
        const obj = await response.json();
        const tm = new TerrainMap(obj);
        setValidID(id);
        setTerrainMap(tm);
      } else {
        const text = await response.text();
        errorMessage('Error fetching map:' + text);
      }
    }
    fetchMap();
  }, [id]);

  const [editKey, setEditKey] = useState('');
  const [validEditKey, setValidEditKey] = useState('');
  const [editKeyLoading, setEditKeyLoading] = useState(false);

  function verifyEditKey() {
    if (id !== validID) return;
    const key = editKey;
    if (key === '' || encodeURIComponent(key) !== key) {
      errorMessage('Please enter a valid edit key');
      return;
    }
    setEditKeyLoading(true);
    fetch(`/api/map/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${key}`,
      },
      body: "{}"
    }).then((response) => {
      if (response.ok) {
        setEditKeyLoading(false);
        setValidEditKey(key);
        toaster.create({
          title: 'Edit Key Verified',
          description: 'You can now save the map.',
          type: 'success'
        });
      } else {
        errorMessage('Edit Key not accepted.');
        setEditKeyLoading(false);
      }
    }).catch((error) => {
      errorMessage('Error verifying edit key: ' + error);
    });
  }


  const editLog = useMemo(() => new Log(terrainMap), [terrainMap]);

  const [version, setVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  useEffect(() => {
    function logObserver() {
      setVersion(editLog.version);
      setCanUndo(editLog.canUndo());
      setCanRedo(editLog.canRedo());
    }
    editLog.addObserver(logObserver);
    logObserver(); // Set initial state
    return () => {
      editLog.removeObserver(logObserver);
      setSavedVersion(0);
    }
  }, [editLog]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  function getCanvas(): HTMLCanvasElement {
    return canvasRef.current as HTMLCanvasElement;
  }

  const [canvasWidth, setCanvasWidth] = useState(500);
  const [canvasHeight, setCanvasHeight] = useState(300);
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

  const [viewOrigin, setViewOrigin] = useState({ x: 0, y: 0 });

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [selectedTerrainModeValue, setSelectedTerrainModeValue] = useState<string>('nothing');
  const [selectedTerrainValue, setSelectedTerrainValue] = useState<string | null>(null);

  const currentTerrain = useMemo<Terrain | undefined | null>(() => {
    if (selectedTerrainModeValue === 'nothing') return null;
    if (selectedTerrainModeValue === 'erase') return undefined;
    if (selectedTerrainValue === null) return null;
    return Terrain[selectedTerrainValue as keyof typeof Terrain];
  }, [selectedTerrainModeValue, selectedTerrainValue]);

  const [currentSize, setCurrentSize] = useState(50);

  useEffect(() => {
    if (canvasRef.current) {
      const newCtx = canvasRef.current.getContext('2d');
      if (!newCtx) return;
      newCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transformations
      newCtx.translate(-viewOrigin.x * currentSize, -viewOrigin.y * currentSize);
      ctxRef.current = newCtx;
    }
  }, [canvasRef, viewOrigin, currentSize]);

  const filenameInputRef = useRef<HTMLInputElement>(null);
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null);

  const drawHexagon = useCallback((hc: HexCoordinate, fillStyle: string) => {
    const ctx = ctxRef.current;
    if (ctx === null) return;
    ctx.fillStyle = fillStyle;
    ctx.lineWidth = style.lineWidth;
    ctx.strokeStyle = style.strokeStyle;
    ctx.beginPath();
    hc.path(ctx, currentSize);
    ctx.fill();
    ctx.stroke();
  }, [style, currentSize]);

  const clearTerrain = useCallback((hc: HexCoordinate) => {
    drawHexagon(hc, style.backgroundStyle);
  }, [drawHexagon, style]);

  const drawTerrain = useCallback((hc: HexCoordinate, terrain: Terrain) => {
    drawHexagon(hc, style.terrainStyle(terrain));
  }, [drawHexagon, style]);

  const getHexCoordinate = useCallback((x: number, y: number) => {
    return HexCoordinate.fromPoint({ x: x / currentSize + viewOrigin.x, y: y / currentSize + viewOrigin.y }).round();
  }, [currentSize, viewOrigin]);

  async function save() {
    if (editKey === '') return;
    const response = await fetch(`/api/map/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${editKey}`,
      },
      body: JSON.stringify(terrainMap.toJSON())
    });
    if (response.ok) {
      setSavedVersion(version);
      toaster.create({
        title: 'Map Saved',
        description: 'The map has been saved.',
        type: 'success'
      });
    } else {
      const text = await response.text();
      errorMessage('Error saving map: ' + text);
    }
  }

  const [loading, setLoading] = useState(false);

  function load() {
    const filenameInput = filenameInputRef.current;
    if (filenameInput === null) return;
    const files = filenameInput.files;
    if (files === null || files.length === 0) {
      alert('No file selected');
      return;
    }
    const f = files[0];
    console.log('file =', f);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const obj = JSON.parse(text);
      const tm = new TerrainMap(obj);
      const commands = [] as Command[];
      for (const { key, terrain } of tm) {
        const oldTerrain = terrainMap.get(key);
        if (oldTerrain === undefined) {
          commands.push(setTerrainCommand(key, terrain, undefined));
        }
        else if (oldTerrain !== terrain) {
          commands.push(setTerrainCommand(key, terrain, oldTerrain));
        }
      }
      if (commands.length > 0) {
        editLog.add(sequenceCommand(commands));
        toaster.create({
          title: 'Map Loaded',
          description: 'Number of individual changes: ' + commands.length,
          type: 'success'
        });
      } else {
        toaster.create({
          title: 'No changes made',
          description: 'Loading the file made no changes to the current map.',
          type: 'info'
        });
      }
      setLoading(false)
    };
    reader.readAsText(f);
    setLoading(true);
  }

  function write() {
    const filenameInput = filenameInputRef.current;
    if (filenameInput === null) return;
    const downloadAnchor = downloadAnchorRef.current;
    if (downloadAnchor === null) return;

    const filename = DEFAULT_FILENAME;

    const blob = new Blob([JSON.stringify(terrainMap)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(downloadAnchor.href);
    downloadAnchor.href = url;
    downloadAnchor.download = filename;
    downloadAnchor.click();
  }

  useEffect(() => {
    const canvas = getCanvas();
    const ctx = ctxRef.current;
    if (canvas === null || ctx === undefined) return;

    const actions: Command[] = [];

    function mouseAction(event: MouseEvent) {
      const rect = getCanvas().getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hc = getHexCoordinate(x, y);
      // console.log('mouseAction', hc, 'currentTerrain', currentTerrain, 'currentSize', currentSize);

      const terrain = currentTerrain;
      if (terrain === null) return; // no action selected
      const current = terrainMap.get(hc);
      if (terrain === undefined) {
        if (current !== undefined) {
          terrainMap.remove(hc);
          actions.push(removeTerrainCommand(hc, current));
          clearTerrain(hc);
        }
      } else if (current !== terrain) {
        terrainMap.set(hc, terrain);
        actions.push(setTerrainCommand(hc, terrain, current));
        drawTerrain(hc, terrain);
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      mouseAction(e);
      return false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) {
        mouseAction(e);
      }
    };
    const onMouseUp = () => {
      if (actions.length > 0) {
        editLog.log(sequenceCommand(actions));
        actions.splice(0, actions.length);
      }
    }
    // console.log('adding mouse listeners to canvas, when terrain is ',currentTerrain);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, currentSize, currentTerrain, terrainMap, editLog, drawTerrain, clearTerrain, getHexCoordinate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCurrentSize((s) =>
        e.deltaY < 0 ? nextSize(s) : prevSize(s)
      );
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    // dx/dy derived from HexDirection move() logic applied to viewOrigin (a=x, b=y)
    const keyMap: { [key: string]: { dx: number; dy: number } } = {
      Numpad4: { dx: -1, dy: 0 },
      Left: { dx: -1, dy: 0 },
      ArrowLeft: { dx: -1, dy: 0 },
      Numpad6: { dx: 1, dy: 0 },
      Right: { dx: 1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      Numpad7: { dx: -1, dy: -1 },
      Numpad9: { dx: 0, dy: -1 },
      Numpad8: { dx: 0, dy: -1 },
      ArrowUp: { dx: 0, dy: -1 },
      Up: { dx: 0, dy: -1 },
      Numpad1: { dx: 0, dy: 1 },
      Numpad3: { dx: 1, dy: 1 },
      Numpad2: { dx: 0, dy: 1 },
      ArrowDown: { dx: 0, dy: 1 },
      Down: { dx: 0, dy: 1 },
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }
      const delta = keyMap[e.code] ?? keyMap[e.key];
      if (delta !== undefined) {
        e.preventDefault();
        setViewOrigin((v) => ({ x: v.x + delta.dx, y: v.y + delta.dy }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function repaint() {
      const ctx = ctxRef.current;
      if (ctx === null) return;
      ctx.fillStyle = style.backgroundStyle;
      ctx.fillRect(0, 0, getCanvas().width, getCanvas().height);
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = style.lineWidth;

      const tl = getHexCoordinate(0, 0);
      const br = getHexCoordinate(getCanvas().width, getCanvas().height);
      for (let a = tl.a; a <= br.a; ++a) {
        for (let b = tl.b; b <= br.b; ++b) {
          const hc = new HexCoordinate(a, b);
          if (terrainMap.get(hc) !== undefined) {
            drawTerrain(hc, terrainMap.get(hc) as Terrain);
          } else {
            clearTerrain(hc);
          }
        }
      }
      // draw axes
      if (viewOrigin.x * currentSize >= -canvasWidth && viewOrigin.x <= 0) {
        ctx.beginPath();
        ctx.moveTo(0, viewOrigin.y * currentSize);
        ctx.lineTo(0, canvasHeight + viewOrigin.y * currentSize);
        ctx.stroke();
      }
      if (viewOrigin.y * currentSize >= -canvasHeight && viewOrigin.y <= 0) {
        ctx.beginPath();
        ctx.moveTo(viewOrigin.x * currentSize, 0);
        ctx.lineTo(canvasWidth + viewOrigin.x * currentSize, 0);
        ctx.stroke();
      }
    };

    if (ctxRef.current !== null) {
      repaint();
    }
  }, [canvasWidth, canvasHeight, viewOrigin, canvasRef, terrainMap, version, currentSize, style, drawTerrain, clearTerrain, getHexCoordinate]);

  return (
    <div>
      <HStack alignItems="center">
        <IconButton variant="surface" aria-label="home" size="sm"
          onClick={() => router.push('/')}
        >
          <LuHouse />
        </IconButton>
        <Select.Root
          value={[selectedTerrainModeValue]}
          onValueChange={(details) => {
            if (details.value.length > 0) setSelectedTerrainModeValue(details.value[0]);
          }}
          collection={terrainModeList}
        >
          <Select.Label>Choose a Mode</Select.Label>
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select a mode" />
              <Select.Indicator><LuChevronDown /></Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {terrainModeList.items.map((item) => (
                <Select.Item item={item} key={item.label}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
        {selectedTerrainModeValue === 'add-terrain' ? (
          <Select.Root
            value={selectedTerrainValue !== null ? [selectedTerrainValue] : []}
            onValueChange={(details) => {
              if (details.value.length > 0) setSelectedTerrainValue(details.value[0]);
            }}
            collection={terrainList}
          >
            <Select.Label>Choose a terrain</Select.Label>
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select a terrain" />
                <Select.Indicator><LuChevronDown /></Select.Indicator>
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {terrainList.items.map((item) => (
                  <Select.Item item={item} key={item.label}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        ) : null}
        <Select.Root
          value={[String(currentSize)]}
          onValueChange={(details) => {
            if (details.value.length > 0) setCurrentSize(Number(details.value[0]));
          }}
          collection={sizeList}
          size="sm"
        >
          <Select.Label>Choose a size</Select.Label>
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="select size" />
              <Select.Indicator><LuChevronDown /></Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {sizeList.items.map((item) => (
                <Select.Item item={item} key={item.label}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
        <IconButton variant="surface" aria-label="zoom in" size="sm"
          onClick={() => setCurrentSize((s) => nextSize(s))}
          disabled={currentSize >= MAX_SIZE}
        >
          <LuZoomIn />
        </IconButton>
        <IconButton variant="surface" aria-label="zoom out" size="sm"
          onClick={() => setCurrentSize((s) => prevSize(s))}
          disabled={currentSize <= MIN_SIZE}
        >
          <LuZoomOut />
        </IconButton>
        <Center width="300px">{`(${viewOrigin.x}, ${viewOrigin.y})`}</Center>
        <IconButton variant="surface" aria-label="move left" size="sm"
          onClick={() => setViewOrigin({ x: viewOrigin.x - 1, y: viewOrigin.y })}
        >
          <LuArrowLeft />
        </IconButton>
        <VStack>
          <IconButton variant="surface" aria-label='move up' size="sm"
            onClick={() => setViewOrigin({ x: viewOrigin.x, y: viewOrigin.y - 1 })}
          >
            <LuArrowUp />
          </IconButton>
          <IconButton variant="surface" aria-label='move down' size="sm"
            onClick={() => setViewOrigin({ x: viewOrigin.x, y: viewOrigin.y + 1 })}
          >
            <LuArrowDown />
          </IconButton>
        </VStack>
        <IconButton variant="surface" aria-label="move right" size="sm"
          onClick={() => setViewOrigin({ x: viewOrigin.x + 1, y: viewOrigin.y })}
        >
          <LuArrowRight />
        </IconButton>
        <TerrainLegend />
        <LightDarkToggleButton />
      </HStack>

      <canvas
        style={{ border: "1px solid black" }}
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
      ></canvas>
      <HStack>
        <Button variant="outline" disabled={!canUndo}
          onClick={() => {
            editLog.undo();
          }}>
          Undo
        </Button>
        <Button variant="outline" disabled={!canRedo}
          onClick={() => {
            editLog.redo();
          }}>
          Redo
        </Button>
        {(id === validID)
          ? <Text> Board ID: {id} </Text>
          : <Text>NO ID (not on server)</Text>}
        {(id !== validID)
          ? <Text>(Cannot be saved)</Text>
          : (editKey === '' || editKey !== validEditKey)
            ? <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="outline" loading={editKeyLoading} loadingText="Checking">
                  Provide Edit Key
                </Button>
              </Dialog.Trigger>
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>Providing the Edit Key</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Text>The Map cannot be saved without a valid edit key.</Text>
                      <br />
                      <Input value={editKey} placeholder='Enter Edit Key' onChange={(e) => setEditKey(e.target.value)} />
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Dialog.ActionTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </Dialog.ActionTrigger>
                      <Button onClick={verifyEditKey}>
                        Verify
                      </Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
            : <Text> Edit Key Provided </Text>}
        <Button variant={(savedVersion == version) ? "outline" : "subtle"} disabled={editKey === ''} onClick={save}>Save</Button>
        <label htmlFor="filename">File to load: </label>
        <input type="file" id="filename" ref={filenameInputRef} accept="*.json" />
        <Button variant="outline"
          loading={loading}
          loadingText="Loading"
          onClick={load}>
          Load
        </Button>
        <Button variant="outline"
          onClick={write}>
          Download
        </Button>
        <a
          ref={downloadAnchorRef}
          style={{ display: "none" }}
          href="blob:"
          download
        >
          Download
        </a>
      </HStack>
      <Toaster />
    </div>
  );

}
