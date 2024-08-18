import { memo } from 'react';

interface MonthNodeProps {
  data: {
    label: string,
    width: number
  }
}

function MonthNode({ data }: MonthNodeProps) {
  return (
    <>
      <div className='border border-indigo-400 bg-indigo-200 flex items-center' style={{ display: 'flex', height: '40px', width: `${data.width}px`, boxSizing: 'border-box' }}>
        <div className='text-m p-2'>{data.label}</div>
      </div>
    </>
  );
}

export default memo(MonthNode);
