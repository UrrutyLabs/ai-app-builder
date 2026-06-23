"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadContextDocAction } from "@/app/_actions/context-docs";

const MAX_CHARS = 500_000;

export function AddContextDocForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mimeType, setMimeType] = useState<"text/markdown" | "text/plain">(
    "text/markdown",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    if (text.length > MAX_CHARS) {
      setError(`File is too large (max ${MAX_CHARS.toLocaleString()} chars).`);
      return;
    }
    setContent(text);
    if (!title) setTitle(file.name.replace(/\.(md|txt|markdown)$/i, ""));
    setMimeType(file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "text/markdown");
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await uploadContextDocAction({
      projectId,
      title: title.trim(),
      content,
      mimeType,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setTitle("");
    setContent("");
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        + Add document
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div className="space-y-2">
        <label htmlFor="doc-title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="Orders PRD"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Upload a file{" "}
          <span className="font-normal text-neutral-500 dark:text-neutral-400">
            (.md or .txt)
          </span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-neutral-200 dark:text-neutral-400 dark:file:bg-neutral-800 dark:file:text-neutral-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="doc-content" className="text-sm font-medium">
          …or paste the content
        </label>
        <textarea
          id="doc-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
          placeholder="# Product requirements&#10;&#10;The orders system should…"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0 || title.trim().length === 0}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {isSubmitting ? "Adding & indexing…" : "Add document"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
