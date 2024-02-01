import { NextSeo } from "next-seo"

export default function ImpactSurveyPage() {
  return (
    <div className="bg-neutral-50 grow">
      <NextSeo
        title="Fatebook impact survey"
        titleTemplate="Fatebook impact survey"
        description="Help us evaluate Fatebook's impact and figure out what to do next"
      />
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-5xl">
        <div className="prose mx-auto">
          <h2 className="text-3xl mb-2 font-extrabold text-neutral-900">
            Fatebook impact survey
          </h2>
          <h3 className="text-neutral-600">
            {
              "Help us evaluate Fatebook's impact and figure out what to do next"
            }
          </h3>
        </div>
        <iframe
          src={
            "https://docs.google.com/forms/d/e/1FAIpQLSed7ird4NuyBcTZywdSZffa7v_tzbpHp3P5kIvJgmErzA9xuw/viewform?=embedded=true"
          }
          className="w-full h-[80vh] my-2"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
        >
          Loading…
        </iframe>
      </div>
    </div>
  )
}
