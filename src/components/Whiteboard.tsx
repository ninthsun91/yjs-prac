'use client';

import { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';
import { useDocContext } from '@/hooks/useDocContext';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export function Whiteboard() {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [initialized, setInitialized] = useState(false);
  const context = useDocContext();

  const init = async (api: ExcalidrawImperativeAPI) => {
    // setExcalidrawAPI(api);
    apiRef.current = api;
  
    if (!context) return;

    const ymap = context.doc.getMap('map');
    const elements = ymap.get('elements') as ExcalidrawElement[];
    console.log('init ymap elements', elements);
    if (elements) {
      console.log('init: elements', elements);
      api.updateScene({ elements });
      console.log('init update scene', api.getSceneElements());
    }
  };

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    // console.log("onChange", elements, state, files);
    // if (state.activeTool.type === 'image' && state.cursorButton === 'down') {
    //   const files = excalidrawAPI.getFiles();
    //   console.log("files added", files);
    // }
  };
  
  useWindowEventListener('keydown', (e) => {
    const api = apiRef.current;
    if (api === null) return;

    const isCtrlOrCmd = e.metaKey || e.ctrlKey;
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = api.getFiles();
        console.log("files pasted", files);
      }, 500);
    } 
  });

  useWindowEventListener('mouseup', (e) => {
    const api = apiRef.current;
    if (api === null) return;

    const elements = api.getSceneElements();
    const files = api.getFiles();
    if (!context) {
      console.log('ymap is null');
      return;
    }
    const ymap = context.doc.getMap('map');
    ymap.set('elements', elements);
    ymap.set('files', files);
  });

  useEffect(() => {
    if (!context) return;

    context.ws.connect();

    const ymap = context.doc.getMap('map');
    ymap.observe((event) => {
      const api = apiRef.current;
      if (api === null) return;

      const elements = ymap.get('elements') as ExcalidrawElement[];
      const files = ymap.get('files') as BinaryFiles;
      api.updateScene({ elements });
      if (files) api.addFiles(Object.values(files));
    });

    setInitialized(true);

    return () => {
      context.ws.disconnect();
    };
  }, [context]);
  
  return (
    <div className="border border-red-500 h-screen">
      {initialized && (
        <Excalidraw
          excalidrawAPI={init}
          onChange={onChangeHandler}
        />
      )}
    </div>
  );
}