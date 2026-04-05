import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const mysticMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mt-8 scroll-mt-4 font-display text-2xl font-semibold tracking-tight text-[#d4af37] first:mt-2 sm:text-[1.65rem]">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-7 scroll-mt-4 border-b border-[#d4af37]/15 pb-2 font-display text-xl font-semibold text-[#f5f0e6] first:mt-2 sm:text-2xl">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-6 font-display text-lg font-semibold text-[#d4af37]/95 sm:text-xl">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="mt-5 font-display text-base font-semibold text-[#f5f0e6]/95 sm:text-lg">
      {children}
    </h5>
  ),
  h5: ({ children }) => (
    <h6 className="mt-4 font-display text-sm font-semibold uppercase tracking-wide text-[#d4af37]/85">
      {children}
    </h6>
  ),
  h6: ({ children }) => (
    <h6 className="mt-4 font-body text-sm font-semibold text-[#f5f0e6]/80">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 font-body text-lg leading-relaxed text-[#f5f0e6]/88 last:mb-0 [&+p]:-mt-1">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 font-body text-lg leading-relaxed text-[#f5f0e6]/85 marker:text-[#d4af37]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 font-body text-lg leading-relaxed text-[#f5f0e6]/85 marker:text-[#d4af37]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="[&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ol]:mt-2">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-4 border-[#7c3aed]/45 bg-[#1a0a2e]/35 py-3 pl-4 pr-2 font-body text-base italic leading-relaxed text-[#f5f0e6]/78 sm:pl-5">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#f5f0e6]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[#d4af37]/92">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#06b6d4] underline decoration-[#06b6d4]/50 underline-offset-[3px] transition hover:text-[#22d3ee] hover:decoration-[#22d3ee]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-0 border-t border-[#d4af37]/20" />,
  code: ({ className, children, ...props }) => {
    const inline = !className
    if (inline) {
      return (
        <code
          className="rounded-md border border-[#d4af37]/25 bg-[#0f172a]/90 px-1.5 py-0.5 font-mono text-[0.88em] text-[#e9d5ff]"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={`${className ?? ''} font-mono text-[0.9em] text-[#e2e8f0]`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mb-5 overflow-x-auto rounded-xl border border-[#d4af37]/20 bg-[#050508]/95 p-4 shadow-[inset_0_1px_0_rgba(212,175,55,0.06)] sm:p-5">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[#d4af37]/15">
      <table className="w-full min-w-[16rem] border-collapse text-left font-body text-base">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#1a0a2e]/90 text-[#d4af37]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="text-[#f5f0e6]/85">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-[#f5f0e6]/10 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 font-display font-semibold sm:px-4">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 sm:px-4 [&>p]:mb-0">{children}</td>
  ),
  del: ({ children }) => (
    <del className="text-[#f5f0e6]/45 line-through decoration-[#f5f0e6]/35">
      {children}
    </del>
  ),
  input: ({ checked, type }) =>
    type === 'checkbox' ? (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        className="mr-2 align-middle accent-[#d4af37]"
        aria-readonly
      />
    ) : (
      <input type={type} />
    ),
}

const compactMarkdownComponents: Components = {
  ...mysticMarkdownComponents,
  p: ({ children }) => (
    <p className="mb-3 font-body text-base leading-relaxed text-[#f5f0e6]/88 last:mb-0 [&+p]:-mt-0.5">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 font-body text-base leading-relaxed text-[#f5f0e6]/85 marker:text-[#d4af37]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 font-body text-base leading-relaxed text-[#f5f0e6]/85 marker:text-[#d4af37]">
      {children}
    </ol>
  ),
  h2: ({ children }) => (
    <h3 className="mt-5 scroll-mt-2 border-b border-[#d4af37]/15 pb-1.5 font-display text-lg font-semibold text-[#f5f0e6] first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-4 font-display text-base font-semibold text-[#d4af37]/95">
      {children}
    </h4>
  ),
}

function safeUrlTransform(u: string): string {
  try {
    const parsed = new URL(u, 'https://example.com')
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return u
    }
  } catch {
    /* ignore */
  }
  return ''
}

interface MysticMarkdownProps {
  content: string
  variant?: 'article' | 'compact'
  className?: string
}

export function MysticMarkdown({
  content,
  variant = 'article',
  className = '',
}: MysticMarkdownProps) {
  const components =
    variant === 'compact' ? compactMarkdownComponents : mysticMarkdownComponents
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={safeUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
