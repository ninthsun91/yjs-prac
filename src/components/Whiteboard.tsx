'use client';

import { useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';
import { useDocContext } from '@/hooks/useDocContext';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>(null!);
  const [initialized, setInitialized] = useState(false);
  const context = useDocContext();

  const init = async (api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  
    if (!context) return;

    const ymap = context.doc.getMap('map');
    const elements = ymap.get('elements') as ExcalidrawElement[];
    if (elements) {
      api.updateScene({ elements });
    }
  };

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    if (!context) {
      console.log('ymap is null');
      return;
    }
    const ymap = context.doc.getMap('map');
    ymap.set('elements', elements);
    ymap.set('files', files);

    // console.log("onChange", elements, state, files);
    // if (state.activeTool.type === 'image' && state.cursorButton === 'down') {
    //   const files = excalidrawAPI.getFiles();
    //   console.log("files added", files);
    // }
  };
  
  useWindowEventListener('keydown', (e) => {
    const isCtrlOrCmd = e.metaKey || e.ctrlKey;
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = excalidrawAPI.getFiles();
        console.log("files pasted", files);
      }, 500);
    } 
  });

  useEffect(() => {
    if (!context) return;

    context.ws.connect();

    const ymap = context.doc.getMap('map');
    ymap.observe((event) => {
      // console.log('ymap changed', event);
      const elements = ymap.get('elements') as ExcalidrawElement[];
      console.log('ymap observe: elements', elements);
      if (elements && excalidrawAPI) {
        excalidrawAPI.updateScene({ elements });
      }
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