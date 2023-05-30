// TODO move this to a shared lib

import { Forecast, Resolution } from '@prisma/client'
import { useSession } from "next-auth/react"


export function getDateYYYYMMDD(date: Date) {
  return `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`
}

export function zeroPad(num: number) {
  return num.toString().padStart(2, '0')
}

export function tomorrrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export function getResolutionEmoji(resolution: Resolution | null) {
  switch (resolution) {
    case Resolution.YES:
      return '✅'
    case Resolution.NO:
      return '❎'
    case Resolution.AMBIGUOUS:
      return '❔'
    default:
      return ''
  }
}

export function toSentenceCase(str: string) {
  if (str.length === 0) {
    return ''
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function useUserId() {
  const session = useSession()
  return session.data?.user.id
}

export function displayForecast(forecast: Forecast, decimalPlaces :number): string {
  return `${formatDecimalNicely(forecast.forecast.times(100).toNumber(), decimalPlaces)}%`
}

export function formatDecimalNicely(num : number, decimalPlaces : number) : string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,})
}