import { useCallback, useEffect, useState } from 'react'
import * as indexeddb from 'lib0/indexeddb'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { WhiteboardData } from '@/components/Whiteboard3'

const DB_NAME = 'meshed.whiteboard.db'
const STORE_NAME = 'meshed.whiteboard.store'

export const useIndexeddb = (projectId: string) => {
  const [db, setDb] = useState<IDBDatabase>(null!)
  const [connected, setConnected] = useState<boolean>(false)

  useEffect(() => {
    indexeddb.openDB(DB_NAME, (db) => {
      db.createObjectStore(STORE_NAME)
    }).then((db) => {
      setDb(db)
      setConnected(true)
    })

    return () => {
      setConnected(false)
    }
  }, [])

  return {
    connected,
    get: useCallback(async (): Promise<WhiteboardData> => {
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
      const item = await indexeddb.get(store, projectId) as ArrayBuffer
      return decode<WhiteboardData>(item)
    }, [projectId, db]),
    set: useCallback(async (data: WhiteboardData<readonly ExcalidrawElement[]>): Promise<void> => {
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
      await indexeddb.put(store, encode(data), projectId)
    }, [projectId, db])
  }
}

function encode (data: any): ArrayBuffer {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder).buffer
}

function decode<T> (buffer: ArrayBuffer): T {
  const decoder = decoding.createDecoder(new Uint8Array(buffer))
  return decoding.readAny(decoder)
}
