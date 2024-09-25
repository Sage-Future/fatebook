import clsx from "clsx"
import Link from "next/link"
import { useState } from "react"
import Select, { components } from "react-select"
import CreatableSelect from "react-select/creatable"
import { api } from "../../lib/web/trpc"
import { getTagPageUrl } from "../../pages/tag/[tag]"
import { TagIcon } from "@heroicons/react/24/outline"

export function TagsSelect({
  tags,
  setTags,
  disabled,
  placeholder = "Add tags...",
  allowCreation = true,
  customStyles = {},
  containerWidth,
}: {
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
  placeholder?: string
  allowCreation?: boolean
  customStyles?: any
  containerWidth?: number
}) {
  const [localTags, setLocalTags] = useState<string[]>(tags)
  const allTagsQ = api.tags.getAll.useQuery()
  const allTags = allTagsQ.data ?? []
  const lightGrey = "#f5f5f5"

  // See https://react-select.com/styles for styling help
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SelectComponent = allowCreation ? CreatableSelect : Select
  return (
    <div className="flex-grow">
      <SelectComponent
        value={localTags.map((tag) => ({
          label: tag,
          value: tag,
          questionCount: 0,
        }))}
        onChange={(newValue) => {
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
        options={allTags
          .sort((a, b) => b.questionCount - a.questionCount) // Sort tags by questionCount descending
          .map((tag) => ({
            label: tag.name,
            value: tag.name,
            questionCount: tag.questionCount,
          }))}
        hideSelectedOptions={true}
        formatCreateLabel={
          allowCreation
            ? (inputValue) => `Add new tag "${inputValue}"`
            : undefined
        }
        formatOptionLabel={(
          option: {
            label: string
            value: string
            questionCount: number
          },
          { context }: { context: string },
        ) => (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <TagIcon className="text-neutral-400 w-4 h-4 min-w-4" />
              <span className="text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </div>
            {context !== "value" && (
              <span className="bg-neutral-100 text-neutral-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {option.questionCount}
              </span>
            )}
          </div>
        )}
        className="cursor-text"
        classNames={{
          control: ({ isFocused }) =>
            clsx(
              "!border-none shadow-inner !cursor-text md:px-2 !rounded-md",
              allowCreation ? "!bg-neutral-200" : "!bg-neutral-100",
              isFocused ? "!shadow-[0_0_0_2px_#6366f1]" : "!shadow-none",
            ),
          menuList: () =>
            containerWidth
              ? `!w-[calc(${containerWidth}px-2.25rem)] !py-0`
              : "!py-0",
          multiValue: () =>
            "!bg-white shadow-sm px-0.5 !rounded-md !cursor-pointer not-prose !p-0",
          multiValueLabel: () =>
            "hover:underline hover:bg-neutral-100 hyphenated break-all hover:rounded-s-md",
          multiValueRemove: () => "text-neutral-400 !px-0.5 !rounded-e-md",
          menu: () =>
            containerWidth ? `!w-[calc(${containerWidth}px-2.25rem)]` : "",
          option: ({ isFocused }) =>
            clsx(
              "flex items-center justify-center p-2 break-all",
              isFocused ? "!bg-[#f5f5f5] !rounded-md" : "",
              "hover:bg-[#f5f5f5] hover:rounded-md",
            ),
          valueContainer: () => "!py-[5px] !md:px-0 !px-2",
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary25: "#e0e7ff",
            primary: "#6366f1",
          },
        })}
        // TODO: replace these with Tailwind classes in classNames above
        // Sometimes the class don't get applied while the styles do :(
        styles={{
          multiValue: (provided, state) => ({
            ...provided,
            maxWidth: "190px",
          }),
          multiValueLabel: (provided, state) => ({
            ...provided,
            wordBreak: "break-all",
            textWrap: "wrap",
          }),
          multiValueRemove: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused
              ? "f5f5f5"
              : provided.backgroundColor,
            ":hover": {
              backgroundColor: lightGrey,
              color: "black",
            },
          }),
          ...customStyles,
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
          DropdownIndicator: () => null,
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
  questionCount?: number
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
