import { memo } from 'react';

interface DayNodeProps {
  data: {
    label: string
  }
}

function DayNode({ data }: DayNodeProps) {
  return (
    <>
      <div className='border-2' style={{ display: 'flex', height: '20px', width: '20px', boxSizing: 'border-box' }}>
        <div className='text-xs'>{data.label}</div>
      </div>
    </>
  );
}

export default memo(DayNode);
