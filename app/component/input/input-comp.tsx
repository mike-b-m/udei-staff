
interface InputProps {
  type: string
  label: string
  name?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  error?: string
  placeholder?: string
}

export default function Input({
  label,
  type,
  name,
  value,
  onChange,
  required = false,
  error,
  placeholder
}: InputProps) {
  return (
    <div className="flex flex-col w-full mb-5">
      <label className="block mb-2 text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-300
          border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50
          ${error
            ? 'border-red-500 bg-red-50 focus:border-red-600'
            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
          }
          placeholder:text-gray-400
          placeholder:font-normal
        `}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1 animate-in fade-in duration-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.291 5.707a1 1 0 011.414 0L10 6.586l.293-.293a1 1 0 111.414 1.414L11.414 8l.293.293a1 1 0 01-1.414 1.414L10 9.414l-.293.293a1 1 0 01-1.414-1.414L8.586 8 8.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}