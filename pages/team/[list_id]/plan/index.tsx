import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import {
ReactFlow,
Background,
useNodesState,
useEdgesState,
addEdge,
Panel,
OnConnect,
Edge,
ReactFlowProvider,
BackgroundVariant,
Node,
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
import { TOTAL_WIDTH, DAY_WIDTH, getDayNodes, getMonthNodes, mapQuestionsToQuestionNodes } from './helpers/planViewHelper';
import PredictionNode from './nodes/PredictionNode';
import WeekNode from './nodes/WeekNode';
import { QuestionWithStandardIncludes } from '../../../../prisma/additional';
import { getGeometricCommunityForecast, getMostRecentForecastPerUserMap } from '../../../../lib/_utils_common';
import { Prisma } from '@prisma/client';

export interface QuestionDetails {
  id: string
  title: string
  resolved: boolean
  resolveBy: Date
  resolution: string | null
  question: QuestionWithStandardIncludes
  userForecasts: Map<string, Forecast>
}

export interface UserDetails {
  id: string
  name: string | null
  image: string | null
}

export interface Forecast {
  user: UserDetails
  forecast: Decimal | null
};

const nodeTypes = {
  prediction: PredictionNode,
  month: MonthNode,
  week: WeekNode,
  day: DayNode,
};

const panOnDrag = [1, 2];

export const NODE_MAX_Y = 700;
export const NODE_MIN_Y = 90;

export function PlanViewPage() {
  const userId = useUserId()
  const router = useRouter()
  const utils = api.useContext()

  const [timetableDayNodes, timetableWeekNodes] = getDayNodes();
  const timetableMonthNodes = getMonthNodes();

  const initialEdges: Array<Edge> = Array<Edge>();

  const [nodes, setNodes] = useNodesState([... timetableMonthNodes, ...timetableWeekNodes, ...timetableDayNodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const [userViewId, setUserViewId] = useState<string>()
  const [userList, setUserList] = useState(Array<UserDetails>())
  const [questionsList, setQuestionsList] = useState(Array<QuestionDetails>())
  const [questionNodes, setQuestionNodes] = useState(Array<Node>())

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
  
  const listQ = api.userList.get.useQuery(
    { id: listId },
    { retry: false }
  )
  
  // const editQuestion = api.question.editQuestion.useMutation({
  //   async onSuccess(_, variables) {
  //     const { questionId } = variables;
  //     await invalidateQuestion(utils, { id: questionId });
  //   },
  // });

  useEffect(() => {
    if (userId) {
      setUserViewId(userId);
    }
  }, [userId]);

  useEffect(() => {
    console.log(userViewId, userId)
    if (userId && userViewId) {
      setQuestionNodes(mapQuestionsToQuestionNodes(questionsList, userId, userViewId))
    }
  }, [userViewId]);

  useEffect(() => {
    if (listQ.data) {
      const updatedUserSet = new Set(
        listQ.data.users.map(user => ({
          id: user.id,
          name: user.name,
          image: user.image
        }))
      );

      updatedUserSet.add({
        id: 'community-user',
        name: 'Community',
        image: null
      })

      setUserList(Array.from(updatedUserSet))

    }
  }, [listQ.data])
  
  useEffect(() => {
    if (questionsQ.data) {

      const updatedQuestionList = questionsQ.data.items.map((question) => ({
        id: question.id,
        title: question.title,
        resolved: question.resolved,
        resolveBy: question.resolveBy,
        resolution: question.resolution,
        question: question,
        userForecasts: new Map<string, Forecast>()
      }))

      setQuestionsList(updatedQuestionList)
    }
  }, [questionsQ.data])

  useEffect(() => {
    if (userId && userViewId) {
      setQuestionNodes(mapQuestionsToQuestionNodes(questionsList, userId, userViewId))
    }
  }, [questionsList, userId])

  useEffect(() => {
    if (userList.length > 0 && questionsList.length > 0) {
      questionsList.forEach(question => {
        const mostRecentForecasts = getMostRecentForecastPerUserMap(question.question.forecasts, new Date())
        userList.forEach(user => {
          if (user.id == 'community-user') {
            question.userForecasts.set(user.id, {
              user: user,
              forecast: new Prisma.Decimal(getGeometricCommunityForecast(question.question, new Date()))
            })
          } else {
            question.userForecasts.set(user.id, {
              user: user,
              forecast: mostRecentForecasts.get(user.id)?.forecast ?? null
            });
          }
        })
      })
    }
  }, [userList, questionsList])

  useEffect(() => {
    setNodes([...timetableWeekNodes, ...timetableDayNodes, ...timetableMonthNodes, ...questionNodes])
  }, [questionNodes])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const parsedChanges = changes.map((change) => {
        if (change.type === "position" && change.position) {
          change.position = { x: change.position.x, y: Math.min(Math.max(change.position.y, NODE_MIN_Y), NODE_MAX_Y) };

          // const resolutionDate = mapPositionToDate(change.position.x)
          // const question = questionsList.find(question => question.id == change.id)
          // if (resolutionDate && resolutionDate != question?.resolveBy) {
          //   editQuestion.mutate({
          //     questionId: change.id,
          //     resolveBy: mapPositionToDate(change.position.x),
          //   })
          // }
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
            {userViewId ? <UserViewToggle userList={userList} selectedUserId={userViewId} handleSelection={setUserViewId} /> : <></>}
            <Background id="1" gap={DAY_WIDTH} color="#ccc" variant={BackgroundVariant.Dots}/>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

interface UserViewToggleProps {
  userList: UserDetails[]
  selectedUserId: string
  handleSelection: Dispatch<SetStateAction<string | undefined>>
}

function UserViewToggle({ userList, selectedUserId, handleSelection }: UserViewToggleProps) {

  return (
    <Panel position="bottom-left">
      <div>
        <label htmlFor="dropdown">User View:</label>
        <select id="dropdown" value={selectedUserId} onChange={(e) => handleSelection(e.target.value)}>
          {Array.from(userList).map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
    </Panel>
  )
}

export default PlanViewPage;
