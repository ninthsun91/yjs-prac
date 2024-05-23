'use client';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { FC, createContext, useEffect, useState } from 'react';

type Context = {
  doc: Y.Doc;
  ws: WebsocketProvider;
};

export const YDocContext = createContext<Context | null>(null);

export const YDocProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doc, setDoc] = useState<Context | null>(null);

  useEffect(() => {
    if (doc === null) {
      const yDoc = new Y.Doc();
      console.log('doc init', yDoc.clientID);

      const ws = new WebsocketProvider(
        'ws://localhost:1234',
        'room-id',
        yDoc,
        { connect: false },
      );
      ws.on('status', (event: any) => {
        console.log('status', event.status);
      });
      
      setDoc({ doc: yDoc, ws });
    }
  }, [doc]);

  return (
    <YDocContext.Provider value={doc}>
      {children}
    </YDocContext.Provider>  
  );
};