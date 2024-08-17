import { memo, useState } from 'react';
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';
import { mapPositionToDate } from '../helpers/planViewHelper';

const labelStyle = {
  position: 'absolute',
  color: '#555',
  bottom: -15,
  fontSize: 8,
};

interface DateIndicatorNodeProps {
  data: {
    label: string
    toolbarPosition: Position
    id: string
  }
}

function DateIndicatorNode({ data }: DateIndicatorNodeProps) {
  const reactFlow = useReactFlow()

  const dateLabel: Date = mapPositionToDate(reactFlow.getNode(data.id)!.position.x)
  
  return (
    <>
      <NodeToolbar
        position={data.toolbarPosition ?? Position.Top }
      >
        <div>{dateLabel.toDateString()}</div>
      </NodeToolbar>
      <div className="react-flow__node-default">{data?.label}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export default memo(DateIndicatorNode);
