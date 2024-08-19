import { memo } from 'react';
import { WEEK_WIDTH } from '../helpers/planViewHelper';

function WeekNode() {
  return (
    <>
      <div className='border border-indigo-200 flex items-center justify-center' style={{ display: 'flex', height: `800px`, width: `${WEEK_WIDTH}px`, boxSizing: 'border-box' }}>
      </div>
    </>
  );
}

export default memo(WeekNode);
