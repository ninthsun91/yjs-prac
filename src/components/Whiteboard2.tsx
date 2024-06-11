'use client';

import { useCallback, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { io, Socket } from 'socket.io-client';

import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

import { useCallbackRefState } from '@/hooks/useCallbackStateRef';
import { useWindowEventListener } from '@/hooks/useWindowEventListener';

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

interface WhiteboardData {
  elements: readonly ExcalidrawElement[];
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
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>();

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => { };

  useWindowEventListener('keydown', (e) => {
    if (!excalidrawAPI) return;
    const isCtrlOrCmd = e.metaKey || e.ctrlKey;
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = excalidrawAPI.getFiles();
        console.log("files pasted", files);
      }, 500);
    }
  });

  useWindowEventListener('mouseup', (e) => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const files = excalidrawAPI.getFiles();
    socket.emit('update', encodeData({ elements, files }));
  });

  const addSocketListeners = useCallback((socket: Socket) => {
    socket.on('connect', () => {
      console.log('connected to socket server', socket.id);
    });

    socket.on('sync', (buffer: ArrayBuffer) => {
      const data = decodeData(buffer);
      console.log('sync', data);
      excalidrawAPI!.updateScene(data);
      if (data.files) excalidrawAPI!.addFiles(Object.values(data.files));
    })
  }, [excalidrawAPI])

  useEffect(() => {
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!excalidrawAPI) return;

    socket.connect();
    addSocketListeners(socket);
  }, [excalidrawAPI, addSocketListeners]);

  return (
    <div className="border border-red-500 h-screen">
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
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
