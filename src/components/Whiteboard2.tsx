'use client'

import { useCallback, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

import { useCallbackRefState } from '@/hooks/useCallbackStateRef'
import { useWindowEventListener } from '@/hooks/useWindowEventListener'
import { useSocketio } from '@/hooks/useSocketio'

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const projectId = 'project-id';

export function Whiteboard2() {
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>()
  const { isConnected, listenSync, update } = useSocketio(projectId)

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => { }

  useWindowEventListener('keydown', (e) => {
    if (excalidrawAPI == null) return
    const isCtrlOrCmd = e.metaKey || e.ctrlKey
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = excalidrawAPI.getFiles()
        console.log('files pasted', files)
      }, 500)
    }
  })

  useWindowEventListener('mouseup', (e) => {
    e.preventDefault()
    if (excalidrawAPI == null) return
    const elements = excalidrawAPI.getSceneElements()
    update(elements)
  })

  const addSocketListeners = useCallback(() => {
    listenSync(excalidrawAPI!)
  }, [excalidrawAPI, listenSync])

  useEffect(() => {
    if (excalidrawAPI == null || !isConnected) return

    addSocketListeners()
  }, [excalidrawAPI, isConnected, addSocketListeners])

  return (
    <div className='border border-red-500 h-screen'>
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChangeHandler}
      />
    </div>
  )
}

