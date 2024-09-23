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

  // See https://react-select.com/styles for styling help
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SelectComponent = allowCreation ? CreatableSelect : Select
  return (
    <div className="">
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
              <TagIcon className="text-neutral-400 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">
                {context === "menu" && option.label.length > 20
                  ? `${option.label.slice(0, 20)}...`
                  : option.label}
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
          menuList: (provided) => ({
            ...provided,
            paddingTop: 0,
            paddingBottom: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            "@media (max-width: 768px)": {
              gridTemplateColumns: "1fr",
            },
          }),
          multiValue: (provided) => ({
            ...provided,
            padding: "0rem",
          }),
          multiValueLabel: (provided) => ({
            ...provided,
            ":hover": {
              borderRadius: "6px 0 0 6px",
            },
          }),
          multiValueRemove: (provided, state) => ({
            ...provided,
            padding: "0.25rem",
            borderRadius: "0 6px 6px 0",
            backgroundColor: state.isFocused
              ? "f5f5f5"
              : provided.backgroundColor,
            ":hover": {
              backgroundColor: "#f5f5f5",
              borderRadius: "0 6px 6px 0",
              color: "black",
            },
          }),
          option: (provided, state) => ({
            ...provided,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem",
            wordBreak: "break-all",
            backgroundColor: state.isFocused
              ? "#f5f5f5"
              : provided.backgroundColor,
            borderRadius: state.isFocused ? "6px" : provided.borderRadius,
            ":hover": {
              backgroundColor: "#f5f5f5",
              borderRadius: "6px",
            },
          }),
          valueContainer: (provided) => ({
            ...provided,
            padding: "5px 0",
            "@media (max-width: 768px)": {
              padding: "5px 8px",
            },
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
