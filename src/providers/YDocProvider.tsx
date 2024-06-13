'use client'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { FC, createContext, useEffect, useState } from 'react'

interface Context {
  // connected: false;
  init: (roomId: string, cb: () => void) => void
  disconnect: () => void
  getData: (roomId: string) => Y.Map<unknown>
}

const URL = 'ws://localhost:1234'
const ELEMENTS = 'elements'
const FILES = 'files'

export const YDocContext = createContext<Context | null>(null)

export const YDocProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [context, setContext] = useState<Context | null>(null)
  const [connected, setConnected] = useState(false)
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [ws, setWs] = useState<WebsocketProvider | null>(null)
  const [db, setDb] = useState<IndexeddbPersistence | null>(null)

  const init = (roomId: string, cb: () => void) => {
    const doc = new Y.Doc()
    setDoc(doc)

    const ws = new WebsocketProvider(URL, roomId, doc)
    ws.on('status', (event: any) => {
      console.log('status', ws.roomname, event.status)

      if (event.status === 'connected') {
        // setConnected(true);
        setTimeout(cb)
      }
    })
    setWs(ws)

    const db = new IndexeddbPersistence(roomId, doc)
    setDb(db)
  }

  const disconnect = () => {
    ws?.disconnect()
    db?.destroy()
  }

  const getData = (roomId: string) => {
    console.log('getData', doc)
    if (doc == null) {
      throw new Error('doc not initialized')
    }

    return doc.getMap(roomId)
  }

  useEffect(() => {
    setContext({ init, disconnect, getData })
  }, [])

  return (
    <YDocContext.Provider value={context}>
      {children}
    </YDocContext.Provider>
  )
}
