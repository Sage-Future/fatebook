import { NextSeo } from "next-seo"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const above = String.raw`
## Embed Fatebook questions in your website

If you're writing a blog or webpage, use this code snippet to embed a Fatebook question:`

const below = String.raw`
Note - if you want to rapidly create and embed a question into a website that you're not webmaster of (e.g. a Google Doc or Google Sheet), you can use [Fatebook for Chrome](/extension).`

export default function ApiPage() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title="Embed Fatebook questions in your website"
        description="Add an embedded version of your predictions to your site with this code snippet."
      />
      <div className="mx-auto prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{above}</ReactMarkdown>
        <pre className="bg-neutral-200 text-neutral-800 p-2 rounded-md break-words text-wrap">
          {
            '<iframe\n\tsrc="https://fatebook.io/embed/q/QUESTION_ID?compact=true&requireSignIn=false"\n\twidth="400"\n\theight="200"\n/>'
          }
        </pre>
        <p>{"Here's an example of what it'll look like:"}</p>
        <iframe
          src="https://fatebook.io/embed/q/will-adam-win-the-next-aoe-game---clkqtczp00001l008qcrma6s7?compact=true&requireSignIn=false"
          width="400"
          height="200"
        />
        <p>
          {
            "To set the src correctly, you can copy a link to your question and add /embed/ before /q/ in the URL."
          }
        </p>
        <p>
          {
            "You'll typically want to share your question with anyone with the link. Otherwise other readers will need to sign in to Fatebook and will only see your embedded question if you've shared the question with them on Fatebook."
          }
        </p>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{below}</ReactMarkdown>
      </div>
    </div>
  )
}
