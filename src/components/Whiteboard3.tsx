
'use client'

import { useEffect, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

import { useCallbackRefState } from '@/hooks/useCallbackStateRef'
import { useDocumentEventListener } from '@/hooks/useDocumentEventListener'
import { WhiteboardSync } from './WhiteboardSync'

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const projectId = 'project-id'

export function Whiteboard3() {
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>()
  const [sync, setSync] = useState<WhiteboardSync>()
  const [cursor, setCursor] = useState<'up' | 'down'>('up')

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    if (cursor === 'down' && state.cursorButton === 'up') {
      sync?.update(elements)
    }
    if (cursor !== state.cursorButton) setCursor(state.cursorButton)
  }

  const init = async (sync: WhiteboardSync) => {
    await sync.connect()
    sync.listen()

    setSync(sync)
  }

  const updateScene = () => sync?.update(excalidrawAPI!.getSceneElements())
  useDocumentEventListener('focusout', updateScene)
  useDocumentEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') updateScene()
  })

  useEffect(() => {
    if (!excalidrawAPI) return;

    const sync = WhiteboardSync.getInstance(excalidrawAPI, projectId)
    init(sync)
  }, [excalidrawAPI])

  return (
    <div className='border border-red-500 h-screen'>
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChangeHandler}
      />
    </div>
  )
}
