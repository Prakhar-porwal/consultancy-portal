interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export default function Logo({ className = '', iconOnly = false, light = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon: two rising paths meeting — symbolises matching two parties */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#6366F1" />
        <path
          d="M6 26 L12 10 L18 20 L24 10 L30 26"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="18" cy="20" r="2.5" fill="#A5F3FC" />
      </svg>

      {!iconOnly && (
        <span className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          match<span className="text-indigo-500">work</span>
        </span>
      )}
    </div>
  )
}
