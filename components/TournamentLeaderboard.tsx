import { useMemo, useState } from 'react'
import { api } from '../lib/web/trpc'
import { ifEmpty } from '../lib/web/utils'
import { InfoButton } from './InfoButton'

export function TournamentLeaderboard({
  tournamentId,
}: {
  tournamentId: string
}) {
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })

  const [sortConfig, setSortConfig] = useState({ key: 'absoluteScore', direction: 'ascending' })

  const scoresByPlayer = (() => {
    if (!tournamentQ.data) return []

    const resolvedQuestionScores = tournamentQ.data.questions.flatMap(question => question.questionScores.map(score => {
      return ({
        userId: score.userId,
        userName: score.user.name,
        absoluteScore: score.absoluteScore.toNumber(),
        questionsWithAbsoluteScore: 1,
        relativeScore: score.relativeScore?.toNumber(),
        questionsWithRelativeScore: (score.relativeScore !== null) ? 1 : 0,
      })
    })
    )
      .reduce((acc: any[], curr: any) => {
        const existing = acc.find(a => a.userId === curr.userId)
        if (existing) {
          existing.absoluteScore += curr.absoluteScore || 0
          existing.questionsWithAbsoluteScore += curr.questionsWithAbsoluteScore
          existing.relativeScore += curr.relativeScore || 0
          existing.questionsWithRelativeScore += curr.questionsWithRelativeScore
        } else {
          acc.push({ ...curr })
        }
        return acc
      }, [])
      .map((player: any) => ({
        ...player,
        absoluteScore: player.questionsWithAbsoluteScore > 0 ? player.absoluteScore / player.questionsWithAbsoluteScore : undefined,
        relativeScore: player.questionsWithRelativeScore > 0 ? player.relativeScore / player.questionsWithRelativeScore : undefined,
      }))

    const allUniquePlayersWhoSubmittedAtLeastOneForecast = tournamentQ.data?.questions.flatMap(q => q.forecasts).map(forecast => ({
      userId: forecast.userId,
      userName: forecast.user.name,
    })).reduce((acc: any[], curr: any) => {
      const existing = acc.find(a => a.userId === curr.userId)
      if (!existing) {
        acc.push({ ...curr })
      }
      return acc
    }, [])


    return allUniquePlayersWhoSubmittedAtLeastOneForecast.map(p => {
      const scores = resolvedQuestionScores.find(player => player.userId === p.userId)
      return ({
        userId: p.userId,
        userName: p.userName,
        absoluteScore: scores?.absoluteScore,
        relativeScore: scores?.relativeScore,
        numForecasts: tournamentQ.data?.questions.reduce((acc, q) => acc + q.forecasts.filter(f => f.userId === p.userId).length, 0),
        numQuestions: tournamentQ.data?.questions.filter(q => q.forecasts.some(f => f.userId === p.userId)).length || 0,
      })
    })
  })()

  const sortedScores = useMemo(() => {
    if (!tournamentQ.data) return []

    const sortableScores = [...scoresByPlayer]
    if (sortConfig.key === 'user') {
      sortableScores.sort((a, b) => {
        if (a.userName < b.userName) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a.userName > b.userName) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    } else {
      sortableScores.sort((a: any, b: any) => {
        if ((a[sortConfig.key] || 1000) < (b[sortConfig.key] || 1000)) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableScores
  }, [tournamentQ.data, scoresByPlayer, sortConfig.key, sortConfig.direction])

  const defaultDirectionForKey = (key: string) => {
    return key.includes("Score") ? 'ascending' : 'descending'
  }
  const requestSort = (key: string) => {
    let direction = defaultDirectionForKey(key)
    if (sortConfig.key === key && sortConfig.direction === direction) {
      direction = key.includes("Score") ? 'descending' : 'ascending'
    }
    setSortConfig({ key, direction })
  }

  if (!tournamentQ.data || !tournamentQ.data.showLeaderboard) {
    return <></>
  }

  const sortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return <></>
    }
    if (sortConfig.direction === 'ascending') {
      return <span className='ml-1 text-neutral-600'>▲</span>
    }
    return <span className='ml-1 text-neutral-600'>▼</span>
  }

  return (
    <div>
      <h2 className='select-none'>Leaderboard</h2>
      <div className='bg-white overflow-auto max-h-[60vh]'>
        <table className="table w-full py-2">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th></th>
              <th className="cursor-pointer" onClick={() => requestSort('user')}>Player{sortIndicator("user")}</th>
              <th className="cursor-pointer" onClick={() => requestSort('absoluteScore')}>
                Brier<br />score {sortIndicator("absoluteScore")}<InfoButton className='font-normal ml-1' tooltip='Lower is better!' />
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('relativeScore')}>
                Relative<br />Brier {sortIndicator("relativeScore")}<InfoButton className='font-normal ml-1' tooltip='Lower is better! Relative to the median on each question' />
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('numQuestions')}>Questions<br />forecasted{sortIndicator("numQuestions")}</th>
              <th className="cursor-pointer" onClick={() => requestSort('numForecasts')}>Total<br />forecasts{sortIndicator("numForecasts")}</th>
            </tr>
          </thead>
          <tbody>
            {ifEmpty(sortedScores.map((score, index) => (
              <tr key={score.userId}>
                <td className='text-xs text-neutral-400 font-semibold pr-0'>{sortConfig.direction !== defaultDirectionForKey(sortConfig.key) ? sortedScores.length - index : index + 1}</td>
                <td>{score.userName}</td>
                <td>{roundOrUndef(score.absoluteScore)}</td>
                <td>{roundOrUndef(score.relativeScore)}</td>
                <td>{score.numQuestions}</td>
                <td>{score.numForecasts}</td>
              </tr>
            )), <tr><td colSpan={6} className='italic text-neutral-500 text-center'>No resolved questions yet</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function roundOrUndef(num: number | undefined) {
  if (num === undefined) return <span className='text-neutral-400'>-</span>
  return <span>{num.toPrecision(2)}</span>
}
