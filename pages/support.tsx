import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function SupportPage() {
  return (
    <div className="prose mx-auto my-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {String.raw`
Need help? Email us at hello@sage-future.org. 
        
[Back to Fatebook](/)
        `}
      </ReactMarkdown>
    </div>
  )
}
