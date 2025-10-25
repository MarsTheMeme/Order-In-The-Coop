import { Upload, File, X } from "lucide-react";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
}

export function FileUploadZone({ onFilesSelected, accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg" }: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    onFilesSelected(files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("docx")) return "📝";
    if (type.includes("image")) return "🖼️";
    return "📎";
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer hover-elevate ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="zone-file-upload"
      >
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-1">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Support for PDF, DOCX, TXT, and image files
          </p>
          <Button variant="secondary" size="sm" data-testid="button-browse">
            Browse Files
          </Button>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file"
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-3" data-testid={`file-item-${file.id}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant="secondary" className="text-xs">
                        Processing
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  data-testid={`button-remove-${file.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
