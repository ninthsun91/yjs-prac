'use client';

import { useDocContext } from '@/hooks/useDocContext';

export function Buttons() {
  const context = useDocContext();

  const handler = () => {
    if (!context) return;

    const ymap = context.doc.getMap('map');
    const json = ymap.toJSON();
    console.log('ymap: ', json);
  }

  return (
    <div>
      <button className="border border-black" onClick={handler}>Log YMap</button>
    </div>
  );
}