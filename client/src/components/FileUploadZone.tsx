import { Upload, File, X } from "lucide-react";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[], userInstructions?: string) => void;
  accept?: string;
}

export function FileUploadZone({ onFilesSelected, accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv" }: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [userInstructions, setUserInstructions] = useState("");
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
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAnalyze = () => {
    const filesToUpload = uploadedFiles.map(uf => uf.file);
    
    if (filesToUpload.length > 0) {
      onFilesSelected(filesToUpload, userInstructions.trim() || undefined);
      setUploadedFiles([]);
      setUserInstructions("");
    }
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
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return "📊";
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
            Support for PDF, DOCX, TXT, Excel, CSV, and image files
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
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
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
                            Ready
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm font-medium">
              Analysis Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="E.g., 'Focus on finding important dates and deadlines' or 'Look for party names and contact information'"
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              className="resize-none h-20"
              data-testid="textarea-instructions"
            />
            <p className="text-xs text-muted-foreground">
              Tell Tender what to focus on during analysis
            </p>
          </div>

          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            data-testid="button-analyze"
          >
            Analyze Documents
          </Button>
        </div>
      )}
    </div>
  );
}
