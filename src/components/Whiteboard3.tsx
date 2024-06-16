
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

import { useCallbackRefState } from '@/hooks/useCallbackStateRef'
import { useDocumentEventListener } from '@/hooks/useDocumentEventListener'
import { WhiteboardSync } from './WhiteboardSync'
import { useIndexeddb } from '@/hooks/useIndexedDB'

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const projectId = 'project-id'

export interface WhiteboardData<T = ExcalidrawElement[]> {
  elements: T
  // state: AppState
  // files: BinaryFiles
}

async function fetchFromServer(projectId: string, load: () => Promise<WhiteboardData>) {
  try {
    const response = await fetch(`https://test.meshed3d.com/api/v1/whiteboards/${projectId}`)
    if (response.status !== 200) throw new Error();
    return { elements: [] }
  } catch (error) {
    return await load()
  }
}

export function Whiteboard3() {
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>()
  const [sync, setSync] = useState<WhiteboardSync>()
  const [cursor, setCursor] = useState<'up' | 'down'>('up')
  const db = useIndexeddb(projectId)

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    if (cursor === 'down' && state.cursorButton === 'up') {
      sync?.update(elements)
      db.set({ elements })
    }
    if (cursor !== state.cursorButton) setCursor(state.cursorButton)
  }

  const init = useCallback(async (sync: WhiteboardSync) => {
    const data = await (async () => {
      const connectedUserCount = await sync.connect()
      if (connectedUserCount > 1) {
        console.log('fetch initial data from peers')
        return await sync.fetchFromPeer()
      } else {
        console.log('fetch initial data from server')
        return await fetchFromServer(projectId, db.get)
      }
    })()
    excalidrawAPI?.updateScene(data)

    sync.listen(db.set, db.get)

    setSync(sync)
  }, [excalidrawAPI, db.get, db.set])

  const updateScene = () => {
    const elements = excalidrawAPI!.getSceneElements()
    sync?.update(elements)
    db.set({ elements })
  }
  useDocumentEventListener('focusout', updateScene)
  useDocumentEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') updateScene()
  })

  useEffect(() => {
    console.log('useEffect', excalidrawAPI?.id, db.connected)
    if ((excalidrawAPI == null) || !db.connected) return

    const sync = WhiteboardSync.getInstance(excalidrawAPI, projectId)
    init(sync)
  }, [excalidrawAPI, db.connected, init])

  return (
    <div className='border border-red-500 h-screen'>
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChangeHandler}
      />
    </div>
  )
}
