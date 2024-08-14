import clsx from "clsx"
import Link from "next/link"
import { useState } from "react"
import Select, { components } from "react-select"
import CreatableSelect from "react-select/creatable"
import { api } from "../../lib/web/trpc"
import { getTagPageUrl } from "../../pages/tag/[tag]"

export function TagsSelect({
  tags,
  setTags,
  disabled,
  placeholder = "Add tags...",
  allowCreation = true,
}: {
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
  placeholder?: string
  allowCreation?: boolean
}) {
  const [localTags, setLocalTags] = useState<string[]>(tags)
  const allTagsQ = api.tags.getAll.useQuery()
  const allTags = allTagsQ.data ?? []

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SelectComponent = allowCreation ? CreatableSelect : Select
  return (
    <div className="">
      <SelectComponent
        value={localTags.map((tag) => ({ label: tag, value: tag }))}
        onChange={(newValue) => {
          console.log(newValue)
          const newTags = newValue.map((v) => v.value)
          setLocalTags(newTags)
          setTags(newTags)
        }}
        onCreateOption={
          allowCreation
            ? (newValue) => {
                const newTags = [...localTags, newValue]
                setLocalTags(newTags)
                setTags(newTags)
              }
            : undefined
        }
        options={allTags.map((tag) => ({ label: tag.name, value: tag.name }))}
        hideSelectedOptions={true}
        formatCreateLabel={
          allowCreation
            ? (inputValue) => `Add new tag "${inputValue}"`
            : undefined
        }
        className="cursor-text"
        classNames={{
          control: () =>
            clsx(
              "!border-none shadow-inner !cursor-text md:px-2",
              allowCreation ? "!bg-neutral-200" : "!bg-neutral-100",
            ),
          multiValue: () =>
            "!bg-white shadow-sm px-0.5 !rounded-md !cursor-pointer not-prose",
          multiValueLabel: () => "hover:underline hover:bg-neutral-100",
          multiValueRemove: () => "text-neutral-400 !px-0.5",
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary25: "#e0e7ff",
            primary: "#6366f1",
          },
        })}
        styles={{
          control: (provided, state) => ({
            ...provided,
            // 2px box shadow
            boxShadow: state.isFocused ? "0 0 0 2px #6366f1" : "none",
          }),
        }}
        noOptionsMessage={() =>
          allowCreation
            ? "Type to add a tag. Your tags are visible only to you."
            : "Tag your forecasting questions, then you can filter by them here to see your track record for specific tags (e.g. 'time tracking', 'AI' or 'in-depth forecasts')."
        }
        closeMenuOnSelect={false}
        components={{
          MultiValueLabel,
          // hide the dropdown chevron
          // eslint-disable-next-line @typescript-eslint/naming-convention
          DropdownIndicator: () => null,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          IndicatorSeparator: () => null,
        }}
        isMulti={true}
        isLoading={allTagsQ.isLoading}
        isDisabled={disabled}
        isClearable={false}
        allowCreateWhileLoading={true}
        placeholder={placeholder}
      />
    </div>
  )
}

function MultiValueLabel(props: {
  data: { value: string }
  [key: string]: any
}) {
  return (
    <Link
      href={getTagPageUrl(props.data.value)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <components.MultiValueLabel {...(props as unknown as any)} />
    </Link>
  )
}
