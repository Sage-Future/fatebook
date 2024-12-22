import { OptionType } from "../components/predict-form/PredictProvider"

export function normalizeOptionsToHundred(options: OptionType[]) {
  const optionsCopy = [...options]
  const optionsWithForecasts = optionsCopy.filter(
    ({ forecast }) => forecast !== undefined && !Number.isNaN(forecast)
  ) as Array<OptionType & { forecast: number }>
  const optionsWithoutForecasts = optionsCopy.filter(
    ({ forecast }) => forecast === undefined || Number.isNaN(forecast)
  )

  const allOptionsHaveForecasts = optionsWithForecasts.length === optionsCopy.length
  const totalPercentage = optionsWithForecasts.reduce(
    (acc, option) => acc + option.forecast,
    0
  )

  if (allOptionsHaveForecasts) {
    optionsWithForecasts.forEach((option, index) => {
      const scaledValue = (option.forecast * 100) / totalPercentage
      optionsCopy[index] = {
        ...option,
        forecast: scaledValue
      }
    })
  } else {
    const remainingMass = Math.max(0, 100 - totalPercentage)
    const massPerOption = remainingMass / optionsWithoutForecasts.length

    optionsWithoutForecasts.forEach((option) => {
      const originalIndex = options.findIndex((o) => o === option)
      optionsCopy[originalIndex] = {
        ...option,
        forecast: massPerOption
      }
    })
  }

  return optionsCopy
}