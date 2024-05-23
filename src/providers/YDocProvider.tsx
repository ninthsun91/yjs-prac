'use client';

import * as Y from 'yjs';
import { FC, createContext, useEffect, useState } from 'react';

export const YDocContext = createContext<Y.Doc | null>(null);

export const YDocProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doc, setDoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    if (doc === null) {
      const yDoc = new Y.Doc();
      console.log('doc init', yDoc.clientID);
      setDoc(yDoc);
    }
  }, [doc]);

  return (
    <YDocContext.Provider value={doc}>
      {children}
    </YDocContext.Provider>  
  );
};