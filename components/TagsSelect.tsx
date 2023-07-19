import { Tag } from '@prisma/client'
import { useState } from 'react'
import Select from 'react-select/creatable'
import { api } from '../lib/web/trpc'

export function TagsSelect({
  tags,
  setTags,
  disabled,
} : {
  tags: Tag[],
  setTags: (tags: string[]) => void
  disabled?: boolean,
}) {
  const [localTags, setLocalTags] = useState<string[]>(tags.map(t => t.name))
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
        classNames={{
          control: () => '!bg-transparent !border-none',
          multiValue: () => '!bg-neutral-200 px-0.5 !rounded-md',
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
        // hide the dropdown chevron
        components={{
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
        placeholder="+ Add tags"
      />
    </div>
  )
}