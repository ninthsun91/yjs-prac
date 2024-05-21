'use client';

import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { useState } from 'react';

export function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>(null!);

  const init = async (api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }
  
  return (
    <div className="border border-red-500 h-screen">
      <Excalidraw excalidrawAPI={init} />
    </div>
  );
}