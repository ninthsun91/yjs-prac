'use client';

import { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';
import { WhiteboardSync } from '@/providers/WhiteboardSync';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

const ROOM_ID = 'project-id';

export function Whiteboard() {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null!);
  const [sync, setSync] = useState<WhiteboardSync>(null!);
  const [initialized, setInitialized] = useState(false);

  const init = async (api: ExcalidrawImperativeAPI) => {
    if (initialized) return;
    
    apiRef.current = api;
    console.log('init excalidraw', api, sync);

    await sync.connect(api, ROOM_ID);
    sync.listen();

    setInitialized(true);
  };

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    // console.log("onChange", state);
    // if (state.activeTool.type === 'image' && state.cursorButton === 'down') {
    //   const files = excalidrawAPI.getFiles();
    //   console.log("files added", files);
    // }
  };

  const updateWhiteboard = () => {
    if (initialized) sync.update();
  };
  useWindowEventListener('focusout', updateWhiteboard);
  useWindowEventListener('click', updateWhiteboard);
  
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

  useEffect(() => {
    const sync = WhiteboardSync.getInstance();
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
        onPaste={(data, event) => {
          console.log('onPaste', data, event)
          return true;
        }}
      />
    </div>
  );
}