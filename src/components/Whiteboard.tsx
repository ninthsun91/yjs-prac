'use client';

import { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';
import { useDoc } from '@/hooks/useDoc';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>(null!);
  const ymap = useDoc()?.getMap('map');

  const init = async (api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    if (ymap === undefined) {
      console.log('ymap is null');
      return;
    }
    ymap.set('elements', elements);
    ymap.set('files', files);
    // console.log("onChange", elements, state, files);
    // if (state.activeTool.type === 'image' && state.cursorButton === 'down') {
    //   const files = excalidrawAPI.getFiles();
    //   console.log("files added", files);
    // }
    console.log('map', ymap.toJSON());
  }
  
  useWindowEventListener('keydown', (e) => {
    const isCtrlOrCmd = e.metaKey || e.ctrlKey;
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = excalidrawAPI.getFiles();
        console.log("files pasted", files);
      }, 500);
    } 
  });
  
  return (
    <div className="border border-red-500 h-screen">
      <Excalidraw excalidrawAPI={init} onChange={onChangeHandler} />
    </div>
  );
}