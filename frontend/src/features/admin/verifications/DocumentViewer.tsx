import { ChevronLeft, ChevronRight, FileWarning, Lock } from "lucide-react";
import { useState } from "react";
import type { DoctorDocument, SignedUrl } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatBytes } from "@/lib/format";

const DOC_TYPES = { licence: "Registration certificate", degree: "Degree", id: "Identity proof" };

export function DocumentViewer({ doctorId, documents }: { doctorId: string; documents: DoctorDocument[] }) {
  const [index, setIndex] = useState(0);
  const doc = documents[index];
  const link = useApi<SignedUrl>(doc ? `/admin/doctors/${doctorId}/documents/${doc.id}/view` : null);

  if (!doc) return <p className="text-small text-muted">No documents uploaded.</p>;
  const title = DOC_TYPES[doc.doc_type];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-text">{title}</p>
          <p className="truncate text-caption text-subtle">
            {doc.file_name}, {index + 1} of {documents.length} · {formatBytes(doc.size)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setIndex(index - 1)} disabled={index === 0} aria-label="Previous document">
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIndex(index + 1)}
            disabled={index === documents.length - 1}
            aria-label="Next document"
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex aspect-[10/7] w-full items-center justify-center overflow-hidden rounded-md border border-border bg-surface-muted">
        {link.error ? (
          <div className="flex flex-col items-center gap-2 text-small text-muted">
            <FileWarning className="size-6" aria-hidden />
            {link.error.message}
            <Button size="sm" variant="outline" onClick={link.reload}>
              Try again
            </Button>
          </div>
        ) : !link.data || link.loading ? (
          <Spinner />
        ) : link.data.mime.startsWith("image/") ? (
          <img src={link.data.url} alt={`${title}: ${doc.file_name}`} className="size-full object-contain" />
        ) : (
          <iframe title={`${title}: ${doc.file_name}`} src={link.data.url} className="size-full bg-surface" />
        )}
      </div>

      <p className="flex items-center gap-1.5 text-caption text-subtle">
        <Lock className="size-3.5" aria-hidden />
        Secure link, expires in 5 minutes. This view is logged.
      </p>
    </div>
  );
}
