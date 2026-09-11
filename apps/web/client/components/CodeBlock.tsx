import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "cn"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div
      className={cn(
        "group relative my-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-950 text-zinc-50 shadow-xs dark:border-zinc-800",
        className
      )}
    >
      {(filename || language) && (
        <div className="flex h-10 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 text-xs text-zinc-400">
          <span className="font-mono text-[11px] font-medium tracking-tight text-zinc-300">
            {filename || language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="复制代码"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span className="text-[11px]">复制</span>
              </>
            )}
          </button>
        </div>
      )}
      {!filename && !language && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-md bg-zinc-800/80 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-700 hover:text-zinc-100 group-hover:opacity-100"
          aria-label="复制代码"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  )
}
