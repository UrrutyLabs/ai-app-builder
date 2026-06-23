"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    if (text.length > MAX_CHARS) {
      toast.error(`File is too large (max ${MAX_CHARS.toLocaleString()} chars).`);
      return;
    }
    setContent(text);
    if (!title) setTitle(file.name.replace(/\.(md|txt|markdown)$/i, ""));
    setMimeType(
      file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "text/markdown",
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await uploadContextDocAction({
      projectId,
      title: title.trim(),
      content,
      mimeType,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Document added and indexed");
    setTitle("");
    setContent("");
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Add document
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="doc-title">Title</Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Orders PRD"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-file">
          Upload a file{" "}
          <span className="font-normal text-muted-foreground">
            (.md or .txt)
          </span>
        </Label>
        <Input
          id="doc-file"
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-content">…or paste the content</Label>
        <Textarea
          id="doc-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="font-mono text-xs leading-relaxed"
          placeholder="# Product requirements&#10;&#10;The orders system should…"
        />
        <p className="text-xs text-muted-foreground">
          {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            content.trim().length === 0 ||
            title.trim().length === 0
          }
        >
          {isSubmitting ? "Adding & indexing…" : "Add document"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
