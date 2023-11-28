import Link from 'next/link'
import { useState } from 'react'
import { components } from 'react-select'
import Select from 'react-select/creatable'
import { api } from '../lib/web/trpc'
import { getTagPageUrl } from '../pages/tag/[tag]'

export function TagsSelect({
  tags,
  setTags,
  disabled,
  placeholder = "Add tags...",
} : {
  tags: string[],
  setTags: (tags: string[]) => void
  disabled?: boolean,
  placeholder?: string,
}) {
  const [localTags, setLocalTags] = useState<string[]>(tags)
  const allTagsQ = api.tags.getAll.useQuery()
  const allTags = allTagsQ.data ?? []

  return (
    <div className=''>
      <Select
        value={localTags.map(tag => ({ label: tag, value: tag }))}
        onChange={(newValue) => {
          console.log(newValue)
          const newTags = newValue.map(v => v.value)
          setLocalTags(newTags)
          setTags(newTags)
        }}
        onCreateOption={(newValue) => {
          const newTags = [...localTags, newValue]
          setLocalTags(newTags)
          setTags(newTags)
        }}
        options={
          allTags.map(tag => ({ label: tag.name, value: tag.name }))
        }
        hideSelectedOptions={true}
        formatCreateLabel={(inputValue) => `Add new tag "${inputValue}"`}
        className='cursor-text'
        classNames={{
          control: () => '!bg-neutral-200 !border-none shadow-inner !cursor-text md:px-2',
          multiValue: () => '!bg-white shadow-sm px-0.5 !rounded-md !cursor-pointer not-prose',
          multiValueLabel: () => 'hover:underline hover:bg-neutral-100',
          multiValueRemove: () => 'text-neutral-400 !px-0.5',
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary25: '#e0e7ff',
            primary: '#6366f1',
          },
        })}
        styles={{
          control: (provided, state) => ({
            ...provided,
            // 2px box shadow
            boxShadow: state.isFocused ? '0 0 0 2px #6366f1' : 'none',
          }),
        }}
        noOptionsMessage={() => "Type to add a tag. Your tags are visible only to you."}
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

function MultiValueLabel(props: {data: { value: string }, [key: string]: any}) {
  return (
    <Link
      href={getTagPageUrl(props.data.value)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <components.MultiValueLabel {...(props as unknown as any)} />
    </Link>
  )
}