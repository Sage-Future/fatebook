import { memo } from 'react';
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';
import { mapPositionToDate } from '../helpers/planViewHelper';
import { UpdateableLatestForecast } from '../../../../../components/questions/UpdateableLatestForecast';
import { QuestionWithStandardIncludes } from '../../../../../prisma/additional';
import { QuestionTitle } from '../../../../../components/questions/QuestionTitle';
import { ResolveButton } from '../../../../../components/questions/ResolveButton';
import { Forecast } from '..';
import { displayForecastIfExists } from '../../../../../lib/_utils_common';

interface PredictionNodeProps {
  data: {
    id: string
    userId: string
    userViewId: string
    title: string
    isResolved: boolean
    userForecasts: Map<string, Forecast>
    // I'd prefer not passing this entire object through, but UpdateableLatestForecast requires it
    // Might refactor this later but it'd be touching on more parts of the code + would need more testing
    question: QuestionWithStandardIncludes
  }
}

function PredictionNode({ data }: PredictionNodeProps) {
  const reactFlow = useReactFlow()
  const dateLabel: Date = mapPositionToDate(reactFlow.getNode(data.id)!.position.x)
  
  return (
    <div className="outline-1 outline rounded-md group-hover:shadow-md bg-white outline-neutral-200 p-2 border max-w-md">
      <NodeToolbar
        position={Position.Top}
        align='start'
        offset={5}
      >
        <div className='text-xs'>{dateLabel.toDateString()}</div>
      </NodeToolbar>

      <div className="col-span-3 flex gap-4 mb-1 justify-between">
        <QuestionTitle
          id={data.id}
          title={data.title}
          embedded={false}
        />
        {
          data.isResolved ?  <ResolveButton question={data.question} /> :
          data.userId == data.userViewId ? <UpdateableLatestForecast question={data.question} /> :
          <span className="font-bold text-lg text-indigo-800 whitespace-nowrap">
            {displayForecastIfExists(data.userForecasts.get(data.userViewId)?.forecast, 2)}
          </span>
        }
        
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(PredictionNode);
