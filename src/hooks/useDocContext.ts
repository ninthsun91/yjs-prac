import { useContext } from 'react'
import { YDocContext } from '@/providers/YDocProvider'

export const useDocContext = () => {
  const context = useContext(YDocContext)
  return context
}
