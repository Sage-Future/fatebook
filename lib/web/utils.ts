// TODO move this to a shared lib

import { Resolution } from "@prisma/client"


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