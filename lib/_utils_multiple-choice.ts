import { OptionType } from "../components/predict-form/PredictProvider"

export function normalizeOptionsToHundred(options: OptionType[]) {
  const optionsWithForecasts = options.filter(
    ({ forecast }) => forecast !== undefined && !Number.isNaN(forecast)
  ) as Array<OptionType & { forecast: number }>

  const optionsWithoutForecasts = options.filter(
    ({ forecast }) => forecast === undefined || Number.isNaN(forecast)
  )

  const allOptionsHaveForecasts = optionsWithForecasts.length === options.length
  const normalizedOptions = [...options]

  if (allOptionsHaveForecasts) {
    const totalPercentage = optionsWithForecasts.reduce(
      (acc, option) => acc + option.forecast,
      0
    )
    optionsWithForecasts.forEach((option, index) => {
      const scaledValue = (option.forecast! * 100) / totalPercentage
      normalizedOptions[index] = {
        ...option,
        forecast: scaledValue
      }
    })
  } else {
    const totalPercentage = optionsWithForecasts.reduce(
      (sum, option) => sum + option.forecast,
      0
    )
    const remainingMass = Math.max(0, 100 - totalPercentage)
    const massPerOption = remainingMass / optionsWithoutForecasts.length

    optionsWithoutForecasts.forEach((option) => {
      const originalIndex = options.findIndex((o) => o === option)
      normalizedOptions[originalIndex] = {
        ...option,
        forecast: massPerOption
      }
    })
  }

  return normalizedOptions
}