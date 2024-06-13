import { useEffect, useState } from 'react'
import * as indexeddb from 'lib0/indexeddb'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const DB_NAME = 'meshed.whiteboard.db'
const STORE_NAME = 'meshed.whiteboard.store'

interface Data {
  elements: readonly ExcalidrawElement[]
  state: AppState
  files: BinaryFiles
}

export const useIndexeddb = (projectId: string) => {
  const [db, setDb] = useState<IDBDatabase>(null!)

  useEffect(() => {
    indexeddb.openDB(DB_NAME, (db) => {
      db.createObjectStore(STORE_NAME)
    }).then((db) => {
      setDb(db)
    })
  }, [])

  return {
    get: async (): Promise<Data> => {
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
      const item = await indexeddb.get(store, projectId) as ArrayBuffer
      return decode(item)
    },
    set: async (data: Data): Promise<void> => {
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
      await indexeddb.put(store, encode(data), projectId)
    }
  }
}

function encode (data: any): ArrayBuffer {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder).buffer
}

function decode (buffer: ArrayBuffer): Data {
  const decoder = decoding.createDecoder(new Uint8Array(buffer))
  return decoding.readAny(decoder)
}
