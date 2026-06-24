// COVO Projects logo — wordmark + 4 brand bars + "Projects"
export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { word: 'text-lg',  bar: 'w-[18px] h-[2.5px]', sub: 'text-[7px] tracking-[3px]' },
    md: { word: 'text-2xl', bar: 'w-[28px] h-[3px]',   sub: 'text-[9px] tracking-[4px]' },
    lg: { word: 'text-4xl', bar: 'w-[40px] h-[4px]',   sub: 'text-xs tracking-[6px]' },
  }
  const s = sizes[size] || sizes.md
  return (
    <div className="flex flex-col items-start select-none">
      <span className={`${s.word} font-black italic text-white leading-none tracking-wider`}>
        COVO
      </span>
      <div className="flex gap-[3px] my-[5px]">
        <span className={`${s.bar} rounded-full`} style={{ background: '#5BE0EF' }} />
        <span className={`${s.bar} rounded-full`} style={{ background: '#E8196A' }} />
        <span className={`${s.bar} rounded-full`} style={{ background: '#F0A500' }} />
        <span className={`${s.bar} rounded-full`} style={{ background: '#00C9A7' }} />
      </div>
      <span className={`${s.sub} uppercase text-ink-muted font-medium`}>Projects</span>
    </div>
  )
}
