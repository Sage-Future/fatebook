import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function Faqs({
  faqs,
}: {
  faqs: { question: string; answer: string }[]
}) {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 divide-y divide-neutral-200 sm:px-6 lg:py-16 lg:px-8">
      <h2 className="text-3xl font-extrabold text-neutral-900">
        Frequently asked questions
      </h2>
      <div className="mt-8">
        <dl className="divide-y divide-neutral-200">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="pt-6 pb-8 md:grid md:grid-cols-12 md:gap-8"
            >
              <dt className="text-base font-medium text-neutral-900 md:col-span-5">
                {faq.question}
              </dt>
              <dd className="mt-2 md:mt-0 md:col-span-7">
                <div className="text-base text-neutral-500 prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {faq.answer}
                  </ReactMarkdown>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
