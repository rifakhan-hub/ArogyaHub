import { FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApiError } from "@/api/client";
import { deleteDocument, uploadDocument } from "@/api/doctors";
import { openFile } from "@/api/files";
import type { DoctorDocument, DocumentType } from "@/api/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { refreshData, useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  licence: "Medical licence",
  degree: "Degree certificate",
  id_proof: "ID proof",
};

const TYPE_OPTIONS = Object.entries(DOCUMENT_LABELS).map(([value, label]) => ({ value, label }));

export function DocumentsSection({ canDelete }: { canDelete: boolean }) {
  const { data: documents } = useApi<DoctorDocument[]>("/doctors/me/documents");
  const [docType, setDocType] = useState<DocumentType>("licence");
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(docType, file);
      toast.success(`Uploaded ${file.name}`);
      refreshData();
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(document: DoctorDocument) {
    try {
      await deleteDocument(document.id);
      toast.success(`Deleted ${document.file_name}`);
      refreshData();
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-h4 font-semibold">Documents</h2>
        <p className="text-small text-muted">Your licence, degree and ID, for the admin who checks your profile.</p>
      </div>

      {documents && documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-small font-semibold">{DOCUMENT_LABELS[d.doc_type]}</span>
                  <span className="block truncate text-caption text-muted">
                    {d.file_name} · {formatBytes(d.size)} · {formatDate(d.uploaded_at)}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openFile(`/doctors/me/documents/${d.id}/file`)}>
                  Open
                </Button>
                {canDelete && (
                  <Button
                    variant="danger-ghost"
                    size="icon-sm"
                    aria-label={`Delete ${d.file_name}`}
                    onClick={() => handleDelete(d)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-small text-muted">No documents yet. Upload at least your medical licence.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select
          aria-label="Document type"
          value={docType}
          onChange={(v) => setDocType(v as DocumentType)}
          options={TYPE_OPTIONS}
          className="w-56"
        />
        <label className={cn(buttonClass("outline", "md"), "cursor-pointer", uploading && "opacity-60")}>
          <Upload aria-hidden />
          {uploading ? "Uploading…" : "Upload file"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </Card>
  );
}
