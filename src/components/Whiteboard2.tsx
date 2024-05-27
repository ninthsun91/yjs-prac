'use client';

import { useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { io, Socket } from 'socket.io-client';

import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

import { useWindowEventListener } from '@/hooks/useWindowEventListener';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

interface WhiteboardData {
  elements: ExcalidrawElement[];
  files: BinaryFiles;
}

const socket = io('http://localhost:3333', {
  auth: {
    token: 'auth token',
  },
  query: {
    projectId: 'project-id-1234',
  },
  withCredentials: true,
  autoConnect: false,
});

export function Whiteboard2() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>(null!);
  const [initialized, setInitialized] = useState(false);

  const init = async (api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
    setInitialized(true);
  };

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
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

  const addSocketListeners = (socket: Socket) => {
    socket.on('connect', () => {
      console.log('connected to socket server', socket.id);
    });

    socket.on('sync', (data: any) => {
      console.log('sync', decodeData(data));
      excalidrawAPI.updateScene(decodeData(data));
    })
  }

  useEffect(() => {
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    socket.connect();
    addSocketListeners(socket);
  }, [initialized]);
  
  return (
    <div className="border border-red-500 h-screen">
      <Excalidraw
        excalidrawAPI={init}
        onChange={onChangeHandler}
      />
    </div>
  );
}

function decodeData(data: ArrayBuffer): WhiteboardData {
  const decoder = decoding.createDecoder(new Uint8Array(data));
  return decoding.readAny(decoder);
}

function encodeData(data: WhiteboardData): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeAny(encoder, data);
  return encoding.toUint8Array(encoder);
}