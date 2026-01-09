"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@/components/icons";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="btn btn-secondary text-xs py-2 px-3">
      {copied ? (
        <>
          <IconCheck className="w-4 h-4" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <IconCopy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
