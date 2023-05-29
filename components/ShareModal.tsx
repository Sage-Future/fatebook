import { Popover, Transition } from "@headlessui/react"
import { UserGroupIcon, UserIcon, UsersIcon } from "@heroicons/react/20/solid"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Fragment } from 'react'
import { api } from "../lib/web/trpc"
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages } from "../prisma/additional"


export function ShareModal({
  question
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  const sharedToSlack = !!question.questionMessages && question.questionMessages.length > 0
  return (
    <div className="text-right">
      <Popover as="div" className="inline-block text-left relative w-full">
        <div className='w-full'>
          <Popover.Button className="bg-white hover:bg-gray-200 text-sm">
            {question.sharedPublicly ? (
              <><UserGroupIcon height={15} /> <span>Public</span></>
            ) :
              question.sharedWith?.length > 0 || sharedToSlack ? (
                <><UsersIcon height={15} /> <span>Shared</span></>
              ) : (
                <><UserIcon height={15} /> <span>Only me</span></>
              )}
          </Popover.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Popover.Panel className="absolute z-50 w-full">
            <div className="absolute z-50 mt-2 w-64 right-0 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-4">
                <SharePublicly question={question} />
                {sharedToSlack && <>
                  <Image src="/slack-logo.svg" width={30} height={30} className="m-0 inline" alt="" />
                  <span className="text-sm">Shared in Slack</span>
                </>}
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  )
}

function SharePublicly({
  question
}: {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessages
}) {
  const session = useSession()
  const userId = session.data?.user.id
  const utils = api.useContext()
  const setSharedPublicly = api.question.setSharedPublicly.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOn.invalidate({userId: session.data?.user.id})
      await utils.question.getQuestion.invalidate({questionId: question.id})
    }
  })
  return (
    <div className="flex gap-2">
      <input
        id="sharePublicly"
        type="checkbox"
        disabled={userId !== question.userId || setSharedPublicly.isLoading}
        checked={question.sharedPublicly}
        onChange={(e) => {
          setSharedPublicly.mutate({
            questionId: question.id,
            sharedPublicly: e.target.checked,
          })
        }}
      />
      <label htmlFor="sharePublicly">Share publicly</label>
    </div>
  )
}

// TODO consider adding
// eslint-disable-next-line no-unused-vars
// function EmailInput() {
//   const [emails, setEmails] = useState<string[]>([])
//   return (
//     <>
//       <label className="block text-sm font-medium text-gray-700">
//       Share with
//       </label>
//       <ReactMultiEmail
//         placeholder="some@email.com"
//         emails={emails}
//         onChange={(emails: string[]) => {
//           setEmails(emails)
//         }}
//         autoFocus={true}
//         getLabel={(email, index, removeEmail) => {
//           return (
//             <div data-tag key={index}>
//               <div data-tag-item>{email}</div>
//               <span data-tag-handle onClick={() => removeEmail(index)}>
//                 ×
//               </span>
//             </div>
//           )
//         }}
//       />
//     </>
//   )
// }