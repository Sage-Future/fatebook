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
      <div className='border-2' style={{ display: 'flex', height: '40px', width: `${data.width}px`, boxSizing: 'border-box' }}>
        <div className='text-m'>{data.label}</div>
      </div>
    </>
  );
}

export default memo(MonthNode);
