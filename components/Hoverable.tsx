import { InformationCircleIcon } from "@heroicons/react/20/solid"

function Hoverable() {
  return (
    <span className="inline-flex my-auto opacity-50">
      <InformationCircleIcon className="h-4 w-4 hover:text-neutral-700" />
    </span>
  )
}
export default Hoverable
