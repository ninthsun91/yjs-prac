'use client'

import { useCallback, useEffect, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

import { useCallbackRefState } from '@/hooks/useCallbackStateRef'
import { useDocumentEventListener } from '@/hooks/useDocumentEventListener'
import { useIndexeddb } from '@/hooks/useIndexedDB'
import { useSocketio } from '@/hooks/useSocketio'

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const projectId = 'project-id'

export function Whiteboard2 () {
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>()
  const [cursor, setCursor] = useState<'up' | 'down'>('up')
  const io = useSocketio(projectId)
  const db = useIndexeddb(projectId)

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    if (cursor === 'down' && state.cursorButton === 'up') {
      io.update(elements)
      db.set({ elements, state, files })
    }
    if (cursor !== state.cursorButton) setCursor(state.cursorButton)
  }

  const addSocketListeners = useCallback(() => {
    io.listenSync(excalidrawAPI!)
  }, [excalidrawAPI, io])

  useEffect(() => {
    if (excalidrawAPI == null || !io.isConnected) return

    addSocketListeners()
  }, [excalidrawAPI, io.isConnected, addSocketListeners])

  const updateScene = () => io.update(excalidrawAPI!.getSceneElements())
  useDocumentEventListener('focusout', updateScene)
  useDocumentEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') updateScene()
  })

  return (
    <div className='border border-red-500 h-screen'>
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChangeHandler}
      />
    </div>
  )
}
