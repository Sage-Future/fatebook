import Link from "next/link";
import { getQuestionUrl } from "../../lib/web/question_url";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";

interface QuestionTitleProps {
  id: string,
  title: string,
  embedded: boolean | undefined
}

export function QuestionTitle({ id, title, embedded }: QuestionTitleProps) {

  return (
    <span
      className={"font-semibold overflow-auto break-words"}
      key={`${id}title`}
    >
      <Link
        href={getQuestionUrl({ id, title })}
        key={id}
        target={embedded ? "_blank" : ""}
        className={"no-underline hover:underline inline items-center"}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {title}
        {embedded && (
          <ArrowTopRightOnSquareIcon className="inline ml-2 h-3 w-3 text-neutral-600" />
        )}
      </Link>
    </span>

  )
}