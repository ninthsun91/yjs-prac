import { useContext } from 'react'
import { YDocContext } from '@/providers/YDocProvider'

export const useDoc = () => {
  const context = useContext(YDocContext);
  return context;
}