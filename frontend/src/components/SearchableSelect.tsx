import { ChevronDown } from 'lucide-react'

export type SearchableOption = {
  value: string
  label: string
}

export default function SearchableSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string
  value: string
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  onChange: (next: string) => void
}) {
  return (
    <div className="relative">
      <select
        id={id}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder ?? 'Todos'}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
