import { zodResolver } from "@hookform/resolvers/zod"
import { QuestionType } from "@prisma/client"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  forecast: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z
        .number()
        .min(0, "Predictions must be 0-100%")
        .max(100, "Predictions must be 0-100%")
        .or(z.nan())
        .optional(),
    )
    .optional(),
})

const unifiedPredictFormSchema = z
  .object({
    question: z
      .string({ required_error: "Question is required" })
      .min(1, "Question is required"),
    resolveBy: z.string(),
    options: z
      .array(optionSchema)
      .min(2, "You need at least two options")
      .max(100, "Maximum 100 options allowed")
      .refine(
        (options) => {
          const texts = options
            .map((option) => option.text)
            .filter((option) => option.length > 0)
          const uniqueTexts = new Set(texts)
          return uniqueTexts.size === texts.length
        },
        {
          message: "All answers must be unique",
        },
      )
      .optional(),
    nonExclusive: z.boolean().optional(),
    predictionPercentage: z
      .number()
      .min(0, "Predictions must be 0-100%")
      .max(100, "Predictions must be 0-100%")
      .or(z.nan())
      .optional(),
    sharePublicly: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.options && data.options.length > 0) {
      const totalForecast = data.options.reduce((sum, option) => {
        const forecast =
          option.forecast && isFinite(option.forecast)
            ? Number(option.forecast)
            : 0
        return sum + forecast
      }, 0)
      if (!data.nonExclusive && totalForecast > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Forecasts must sum to ≤100% (currently ${totalForecast}%)`,
          path: ["options"],
        })
      }
    }
  })

export type PredictFormType = z.infer<typeof unifiedPredictFormSchema>

function usePredictFormStandalone() {
  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.BINARY,
  )
  // `setQuestionInFocus` is manually called via `onFocus`, `onBlur` callbacks,
  // so this could be prone to getting out of sync
  const [questionInFocus, setQuestionInFocus] = useState(false)

  const form = useForm<PredictFormType>({
    mode: "all",
    resolver: zodResolver(unifiedPredictFormSchema),
  })

  const questionTypeChangedCallback = useCallback(
    (newType: QuestionType) => {
      const currentValues = form.getValues()
      if (newType === QuestionType.MULTIPLE_CHOICE) {
        form.reset(
          {
            ...currentValues,
            options: currentValues.options?.length
              ? currentValues.options
              : [
                  { text: "", forecast: NaN },
                  { text: "", forecast: NaN },
                ],
            predictionPercentage: undefined,
          },
          { keepDefaultValues: true },
        )
      } else {
        form.reset(
          {
            ...currentValues,
            predictionPercentage: currentValues.predictionPercentage ?? NaN,
            options: undefined,
          },
          { keepDefaultValues: true },
        )
      }
    },
    [form],
  )

  useEffect(() => {
    questionTypeChangedCallback(questionType)
  }, [questionType, questionTypeChangedCallback])

  return {
    ...form,
    questionType,
    setQuestionType,
    questionInFocus,
    setQuestionInFocus,
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const PredictFormContext = createContext<ReturnType<
  typeof usePredictFormStandalone
> | null>(null)

export function usePredictForm() {
  const contextForm = useContext(PredictFormContext)
  // This is inefficient in the case where `contextForm` exists because it still instantiates `standaloneForm`,
  // additionally it could result in some surprising behaviour if `contextForm` initially exists and is then set to null.
  // It's hard to avoid this double instantiation because conditionally calling hooks is not allowed.
  const standaloneForm = usePredictFormStandalone()

  return contextForm ?? standaloneForm
}

/**
 * Optional provider that exposes the contents of a nested `<Predict />` form to all child components.
 *
 * Example usage:
 * ```
 * <PredictProvider>
 *   <Predict />
 *   <SiblingComponent />
 * </PredictProvider>
 * ```
 * ...
 * ```
 * function SiblingComponent() {
 *   // Retrieves the same instance as <Predict />, so <SiblingComponent />
 *   // can interact with the form
 *   const form = usePredictForm()
 * }
 * ```
 */
export function PredictProvider({ children }: { children: ReactNode }) {
  const form = usePredictFormStandalone()

  return (
    <PredictFormContext.Provider value={form}>
      {children}
    </PredictFormContext.Provider>
  )
}
