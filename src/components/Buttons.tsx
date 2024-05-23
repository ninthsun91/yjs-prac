'use client';

import { useDoc } from '@/hooks/useDoc';

export function Buttons() {
  const ymap = useDoc()?.getMap('map');

  const handler = () => {
    if (!ymap) return;

    const json = ymap.toJSON();
    console.log('ymap: ', json);
  }

  return (
    <div>
      <button className="border border-black" onClick={handler}>Log YMap</button>
    </div>
  );
}