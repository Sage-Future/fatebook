import { NextSeo } from 'next-seo'
import { BaseRow, Importer, ImporterField } from 'react-csv-importer'
import 'react-csv-importer/dist/index.css'
import { toast } from 'react-hot-toast'
import { Questions } from '../components/Questions'
import { api } from '../lib/web/trpc'
import { getCsvIdPrefix, signInToFatebook, useUserId } from '../lib/web/utils'

export default function ImportFromSpreadsheetPage() {
  const userId = useUserId()
  const utils = api.useContext()

  const deleteAllCsvQuestions = api.import.deleteAllCsvQuestions.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-4xl">
      <NextSeo title="Import from spreadsheet" />
      <div className="mx-auto">
        <div className="prose mx-auto">
          <h3>
            Import questions from a spreadsheet into Fatebook
          </h3>
          <ol>
            <li>
              {"Export your forecasts as a CSV file (e.g. from Google Sheets or Excel)"}
            </li>
            <li>
              {"Make sure your CSV file has the following columns:"}
              <ul className='not-prose'>
                {rows.map(row =>
                  <li key={row.name} className='list-none flex flex-row gap-2 align-top'>
                    <input type="checkbox"/>
                    {row.label}
                  </li>
                )}
              </ul>
            </li>
            <li>
              {"Upload your CSV file below"}
            </li>
          </ol>
          <p>{"Spreadsheets can have many different formats so you might need to play around a bit to get this working. If you get stuck, you can email us at "}
            <a href="mailto:hello@sage-future.org">hello@sage-future.org</a></p>
        </div>
        {
          userId ?
            <>
              <CsvImporter />
              <div className="mt-20 prose mx-auto">
                <button
                  className="btn"
                  onClick={(e) => {e.preventDefault(); confirm("Are you sure? This can't be undone") && deleteAllCsvQuestions.mutate()}}
                  disabled={!userId || deleteAllCsvQuestions.isLoading}
                >
                  Delete all your questions imported from spreadsheets
                </button>

                <Questions
                  title="Your questions imported from spreadsheets"
                  noQuestionsText="No questions imported from spreadsheets yet"
                  filterClientSide={question => question.id.startsWith(getCsvIdPrefix()) && question.userId === userId}
                />
              </div>
            </>
            :
            <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
            Sign in or sign up to import your predictions
            </button>
        }
      </div>
    </div>
  )
}

const rows = [
  {
    name: "questionTitle",
    label: "Question title"
  },
  {
    name: "forecast",
    label: "Your forecast (as a number between 0% and 100%)"
  },
  {
    name: "qCreatedAt",
    label: "Question created date"
  },
  {
    name: "resolution",
    label: "Resolution - must be either YES, NO, AMBIGUOUS or blank"
  },
  {
    name: "resolvedAt",
    label: "[Optional] Resolved at date - when the question resolved (if blank and the question is resolved we use the question creation date + 24h)",
    optional: true,
  },
  {
    name: "resolveBy",
    label: "[Optional] Resolve by date - Fatebook will remind you to resolve on this day (if blank we use the question creation date + 24h)",
    optional: true,
  },
  {
    name: "fCreatedAt",
    label: "[Optional] Forecast created date (if blank we use the question creation date)",
    optional: true,
  },
  {
    name: "tags",
    label: "[Optional] Comma-separated list of tags",
    optional: true,
  },
  {
    name: "notes",
    label: "[Optional] Notes",
    optional: true,
  },
  {
    name: "notesExtra",
    label: "[Optional] Extra notes column",
    optional: true,
  },
]

export interface CsvRow extends BaseRow {
  questionTitle: string
  forecast: string
  qCreatedAt: string
  resolution: string
  resolvedAt?: string
  resolveBy?: string
  fCreatedAt?: string
  tags?: string
  notes?: string
  notesExtra?: string
}
function CsvImporter() {
  const utils = api.useContext()
  const importFromCsv = api.import.importFromCsv.useMutation({
    onSuccess: async () => {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      toast("Imported successfully")
    },
    onError: (error) => {
      toast.error(error.message, {
        duration: 30000,
      })
    }
  })

  return (
    <div className="py-12">
      <Importer<CsvRow>
        dataHandler={async (rows, { startIndex }) => {
          console.log({startIndex, rows})
          await importFromCsv.mutateAsync(rows)
        }}
        defaultNoHeader={false} // optional, keeps "data has headers" checkbox off by default
        restartable={true} // lets user choose to upload another file when import is complete
        skipEmptyLines={true}
      >
        {rows.map(row =>
          <ImporterField key={row.name} name={row.name} label={row.label} optional={row.optional} />
        )}
      </Importer>
    </div>
  )
}