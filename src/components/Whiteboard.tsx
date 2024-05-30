'use client';

import { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { WhiteboardSync } from '@/providers/WhiteboardSync';

const ROOM_ID = 'project-id';

export function Whiteboard() {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null!);
  const [sync, setSync] = useState<WhiteboardSync>(null!);
  const [initialized, setInitialized] = useState(false);

  const init = async (api: ExcalidrawImperativeAPI) => {
    if (initialized) return;
    
    apiRef.current = api;
    console.log('init excalidraw', api, sync);

    await sync.connect();
    fetchInitialData();
    setSyncListener();

    setInitialized(true);
  };

  const fetchInitialData = () => {
    const api = apiRef.current;
    const map = sync.getData(ROOM_ID);

    const elements = map.get('elements') as ExcalidrawElement[];
    const files = map.get('files') as BinaryFiles;
    if (elements) api.updateScene({ elements });
    if (files) api.addFiles(Object.values(files));
  }

  const setSyncListener = () => {
    const api = apiRef.current;
    const map = sync.getData(ROOM_ID);
    
    map.observe((event) => {
      if (event.keysChanged.has('elements')) {
        const elements = map.get('elements') as ExcalidrawElement[];
        api.updateScene({ elements });
      }
      if (event.keysChanged.has('files')) {
        const files = map.get('files') as BinaryFiles;
        api.addFiles(Object.values(files));
      }
    });
  }

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    // console.log("onChange", elements, state, files);
    // if (state.activeTool.type === 'image' && state.cursorButton === 'down') {
    //   const files = excalidrawAPI.getFiles();
    //   console.log("files added", files);
    // }
  };
  
  useWindowEventListener('keydown', (e) => {
    const api = apiRef.current;

    const isCtrlOrCmd = e.metaKey || e.ctrlKey;
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = api.getFiles();
        console.log("files pasted", files);
      }, 500);
    } 
  });

  useWindowEventListener('mouseup', (e) => {
    if (!initialized) return;

    const api = apiRef.current;
    const map = sync.getData(ROOM_ID);

    const elements = api.getSceneElements();
    const files = api.getFiles();
    map.set('elements', elements);
    map.set('files', files);
  });

  useEffect(() => {
    const sync = new WhiteboardSync(ROOM_ID);
    setSync(sync);

    return () => {
      sync.disconnect();
    };
  }, []);
  
  return (
    <div className="border border-red-500 h-screen">
      <Excalidraw
        excalidrawAPI={init}
        onChange={onChangeHandler}
      />
    </div>
  );
}