import { useCallback, useEffect, useState } from 'react';
import {
ReactFlow,
MiniMap,
Controls,
Background,
useNodesState,
useEdgesState,
addEdge,
Panel,
OnConnect,
Edge,
ReactFlowProvider,
BackgroundVariant,
Position,
useNodes,
Node,
NodeToolbar,
useReactFlow,
useViewport,
SelectionMode
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { api } from '../../../../lib/web/trpc';
import { useUserId } from '../../../../lib/web/utils';
import { useRouter } from "next/router";
import { Decimal } from '@prisma/client/runtime/library';
import MonthNode from './nodes/MonthNode';
import DayNode from './nodes/DayNode';
import { TOTAL_WIDTH, DAY_WIDTH, WEEK_WIDTH, mapDateToPosition, getDayNodes, getTimetableNodes, getMonthNodes } from './helpers/planViewHelper';
import DateIndicatorNode from './nodes/DateIndicatorNode';

interface QuestionDetails {
  id: string
  title: string
  resolved: boolean
  resolveBy: Date
  resolution: string | null
  forecasts: Forecast[]
}

interface Forecast {
  userId: string
  name: string | null
  forecast: Decimal
}

const nodeTypes = {
  tools: DateIndicatorNode,
  month: MonthNode,
  day: DayNode,
};

const panOnDrag = [1, 2];

export function PlanViewPage() {
  const userId = useUserId()
  const router = useRouter()
  const utils = api.useContext()
  
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const questionsList: QuestionDetails[] = Array<QuestionDetails>()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.list_id && (router.query.list_id as string).match(/(.*)--(.*)/)
  const listId = parts ? parts[2] : (router.query.list_id as string) || ""

  const questionsQ =
    api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery({
      limit: 20,
      cursor: 0,
      extraFilters: {
        filterUserListId: listId
      },
      }
    )
  
  useEffect(() => {
    if (questionsQ.data) {
      questionsQ.data.items.forEach((question) => {
        questionsList.push({
          id: question.id,
          title: question.title,
          resolved: question.resolved,
          resolveBy: question.resolveBy,
          resolution: question.resolution,
          forecasts: question.forecasts.map((forecast => {
            return {
              userId: forecast.userId,
              name: forecast.user.name,
              forecast: forecast.forecast
            }
          }))
        })
      })
    }

    const date = new Date();

    const questionNodes: Node[] = questionsList.map((question => {
      return {
        id: question.id,
        type: 'tools',
        position: { x: mapDateToPosition(question.resolveBy), y: 60 },
        data: { label: question.title, id: question.id },
        targetPosition: Position.Left,
        sourcePosition: Position.Right
      }
    }))


    // console.log(mapDateToPosition(date, ))

    const timetableDayNodes = getDayNodes();
    const timetableMonthNodes = getMonthNodes();

    setNodes(questionNodes.concat(timetableDayNodes, timetableMonthNodes))
  }, [questionsQ.data])
  
  // const setPosition = useCallback(
  //   (pos: any) =>
  //     setNodes((nodes) =>
  //       nodes.map((node) => ({
  //         ...node,
  //         data: { ...node.data, toolbarPosition: pos },
  //       })),
  //     ),
  //   [setNodes],
  // );
  // const forceToolbarVisible = useCallback((enabled: any) =>
  //   setNodes((nodes) =>
  //     nodes.map((node) => ({
  //       ...node,
  //       data: { ...node.data, forceToolbarVisible: enabled },
  //     })),
  //   ), []
  // );

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="plan border-2" style={{ width: TOTAL_WIDTH, height: 800 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            snapToGrid={true}
            snapGrid={[DAY_WIDTH, 1]}
            minZoom={1}
            maxZoom={1}
            translateExtent={[[Number.NEGATIVE_INFINITY, 0], [Number.POSITIVE_INFINITY, 796]]}
            panOnScroll
            panOnDrag={panOnDrag}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
          >
            {/* <Panel>
              <h3>Node Toolbar position:</h3>
              <button onClick={() => setPosition(Position.Top)}>top</button>
              <button onClick={() => setPosition(Position.Right)}>right</button>
              <button onClick={() => setPosition(Position.Bottom)}>bottom</button>
              <button onClick={() => setPosition(Position.Left)}>left</button>
              <h3>Override Node Toolbar visibility</h3>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => forceToolbarVisible(e.target.checked)}
                />
                <span>Always show toolbar</span>
              </label>
            </Panel> */}
            <MiniMap />
            <Background id="1" gap={DAY_WIDTH} color="#ccc" variant={BackgroundVariant.Dots}/>
            <Background id="2" gap={WEEK_WIDTH} offset={[WEEK_WIDTH/2, 10]} color="#badbed" variant={BackgroundVariant.Lines}/>
          </ReactFlow>
          <Sidebar/>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

function Sidebar() {
  // This hook will only work if the component it's used in is a child of a
  // <ReactFlowProvider />.
  const nodes = useNodes()
  const reactFlow = useReactFlow()
  const { x, y, zoom } = useViewport();
 
  return (
    <aside>
      {nodes.map((node) => (
        <div key={node.id}>
          Node {node.id} -
            x: {node.position.x.toFixed(2)},
            y: {node.position.y.toFixed(2)},
        </div>
      ))}
    </aside>
  )
}


export default PlanViewPage;