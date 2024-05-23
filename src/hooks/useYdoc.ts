import * as Y from 'yjs';
import { useEffect, useState } from 'react';

export const useYdoc = () => {
  const [doc, setDoc] = useState<Y.Doc>(null!);

  useEffect(() => {
    const doc = new Y.Doc();
    setDoc(doc);
  }, []);

  return doc;
}

export const doc = new Y.Doc();