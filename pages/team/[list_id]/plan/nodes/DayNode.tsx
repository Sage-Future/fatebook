import { memo } from 'react';

interface DayNodeProps {
  data: {
    label: string
  }
}

function DayNode({ data }: DayNodeProps) {
  return (
    <>
      <div className='border border-indigo-400 bg-indigo-200 flex items-center justify-center' style={{ display: 'flex', height: '20px', width: '20px', boxSizing: 'border-box' }}>
        <div className='text-xs'>{data.label}</div>
      </div>
    </>
  );
}

export default memo(DayNode);
