import { UseFormRegister } from "react-hook-form"

interface EmbeddedOptionsProps {
  register: UseFormRegister<any>
}

export function EmbeddedOptions({ register }: EmbeddedOptionsProps) {
  return (
    <div className="flex items-center">
      <label htmlFor="sharePublicly" className="text-sm max-w-[8rem] ml-2">
        Share with anyone with the link?
      </label>
      <input
        type="checkbox"
        id="sharePublicly"
        defaultChecked={
          typeof window !== "undefined" &&
          window.localStorage.getItem("lastSharedPubliclyState") === "true"
        }
        className="ml-2 checkbox check"
        onClick={(e) => {
          localStorage.setItem(
            "lastSharedPubliclyState",
            e.currentTarget.checked ? "true" : "false",
          )
        }}
        onMouseDown={(e) => e.stopPropagation()}
        {...register("sharePublicly")}
      />
    </div>
  )
}
