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
useReactFlow,
useViewport,
SelectionMode,
NodeChange,
applyNodeChanges
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { api } from '../../../../lib/web/trpc';
import { useUserId } from '../../../../lib/web/utils';
import { useRouter } from "next/router";
import { Decimal } from '@prisma/client/runtime/library';
import MonthNode from './nodes/MonthNode';
import DayNode from './nodes/DayNode';
import { TOTAL_WIDTH, DAY_WIDTH, WEEK_WIDTH, mapDateToPosition, getDayNodes, getMonthNodes } from './helpers/planViewHelper';
import PredictionNode from './nodes/PredictionNode';
import WeekNode from './nodes/WeekNode';
import { QuestionWithStandardIncludes } from '../../../../prisma/additional';

interface QuestionDetails {
  id: string
  title: string
  resolved: boolean
  resolveBy: Date
  resolution: string | null
  question: QuestionWithStandardIncludes
  forecasts: Forecast[]
}

interface Forecast {
  userId: string
  name: string | null
  forecast: Decimal
}

const nodeTypes = {
  prediction: PredictionNode,
  month: MonthNode,
  week: WeekNode,
  day: DayNode,
};

const panOnDrag = [1, 2];

const NODE_MAX_Y = 700;
const NODE_MIN_Y = 90;

export function PlanViewPage() {
  const userId = useUserId()
  const router = useRouter()
  const utils = api.useContext()
  
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes] = useNodesState(initialNodes);
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
          question: question,
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

    const questionNodes: Node[] = questionsList.map((question => {
      return {
        id: question.id,
        type: 'prediction',
        position: {
          x: mapDateToPosition(question.resolveBy),
          y: Math.floor(Math.random() * (NODE_MAX_Y - NODE_MIN_Y + 1)) + NODE_MIN_Y
        },
        data: {
          id: question.id,
          title: question.title,
          isResolved: question.resolved,
          question: question.question
        },
        targetPosition: Position.Left,
        sourcePosition: Position.Right
      }
    }))

    const [timetableDayNodes, timetableWeekNodes] = getDayNodes();
    const timetableMonthNodes = getMonthNodes();

    setNodes([...timetableMonthNodes, ...timetableWeekNodes, ...timetableDayNodes,...questionNodes])
  }, [questionsQ.data])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const parsedChanges = changes.map((change) => {
        if (change.type === "position" && change.position) {
          change.position = { x: change.position.x, y: Math.min(Math.max(change.position.y, NODE_MIN_Y), NODE_MAX_Y ) };
        }

        return change;
      });
      return applyNodeChanges(parsedChanges, nds);
    });
  }, []);

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
            {/* <Controls /> */}
            {/* <MiniMap /> */}
            <Background id="1" gap={DAY_WIDTH} color="#ccc" variant={BackgroundVariant.Dots}/>
          </ReactFlow>
          {/* <Sidebar/> */}
        </ReactFlowProvider>
      </div>
    </div>
  );
}

function Sidebar() {
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
