import { useState } from "react"

/**
 * Returns a [copied, copy] tuple.
 * `copied` flips to true for `resetMs` milliseconds after a successful write,
 * then reverts — useful for swapping a Copy icon to a Check icon as feedback.
 */
export function useCopyToClipboard(resetMs = 1500) {
  const [isCopied, setIsCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), resetMs)
    })
  }

  return [isCopied, copy] as const
}
