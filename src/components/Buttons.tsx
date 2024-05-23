'use client';

import { doc } from '@/hooks/useYdoc';

export function Buttons() {
  const ymap = doc.getMap('map');

  const handler = () => {
    const json = ymap.toJSON();
    console.log('ymap: ', json);
  }

  return (
    <div>
      <button className="border border-black" onClick={handler}>Log YMap</button>
    </div>
  );
}