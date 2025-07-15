import React, { useRef, useState, useEffect } from "react"
import { Box, Button, Typography, Alert, Tooltip, IconButton } from "@mui/material"
import { Upload } from "@mui/icons-material"
import { VisibilityOutlined, VisibilityOffOutlined } from "@mui/icons-material";


interface FileUploaderProps {
  onFileUpload: (data: any, type: "translation" | "schema") => void;
  resetSignal?: boolean; // ✅ new prop
}

function autoConvertToTranslationFormat(obj: any, lang = "en"): Record<string, Record<string, string>> {
  const flatten = (o: any, prefix = ""): Record<string, string> => {
    let result: Record<string, string> = {}

    for (const key in o) {
      const value = o[key]
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey))
      } else {
        result[newKey] = String(value)
      }
    }

    return result
  }

  const flat = flatten(obj)
  const wrapped: Record<string, Record<string, string>> = {}

  for (const [key, value] of Object.entries(flat)) {
    wrapped[key] = { [lang]: value }
  }

  return wrapped
}

function looksLikeFlatTranslationFile(data: any): boolean {
  return typeof data === "object" &&
    Object.values(data).every((val) => typeof val === "string")
}

function looksLikeStructuredTranslationFile(data: any): boolean {
  return typeof data === "object" &&
    Object.values(data).every(
      (val) =>
        typeof val === "object" &&
        val !== null &&
        !Array.isArray(val) &&
        Object.values(val).every((v) => typeof v === "string")
    )
}

export function FileUploader({ onFileUpload, resetSignal }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(() => {
    const saved = localStorage.getItem("i18n-uploaded-files");
    return saved ? JSON.parse(saved) : [];
  });
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    if (resetSignal) {
      setUploadedFiles([]);
    }
  }, [resetSignal]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let data = JSON.parse(content)

        if (data.properties || data.$schema || data.type === "object") {
          // JSON schema file
          onFileUpload(data, "schema")
        } else if (looksLikeStructuredTranslationFile(data)) {
          // Already in the correct format
          onFileUpload(data, "translation")
        } else if (looksLikeFlatTranslationFile(data)) {
          // Convert flat key-value to { key: { lang: value } }
          const converted = autoConvertToTranslationFormat(data, "en")
          onFileUpload(converted, "translation")
        } else if (typeof data === "object") {
          // Fallback: try flattening & wrapping nested object
          const converted = autoConvertToTranslationFormat(data, "en")
          onFileUpload(converted, "translation")
        } else {
          alert("Unrecognized JSON structure. Please upload a valid translation or schema file.")
        }

      } catch (error) {
                alert("Error parsing JSON file. Please check the file format.")
        }
    }

    reader.readAsText(file)
    setUploadedFiles((prev) => [...prev, file.name]);
    localStorage.setItem("i18n-uploaded-files", JSON.stringify([...uploadedFiles, file.name]));


    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Box>
      <input type="file" accept=".json" onChange={handleFileSelect} style={{ display: "none" }} ref={fileInputRef} />

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="outlined" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()}>
          Upload JSON File
        </Button>
        <Tooltip title={showTips ? "Hide tips" : "Show tips"}>
          <IconButton onClick={() => setShowTips((prev) => !prev)} aria-label="Toggle tips">
            {showTips ? (
              <VisibilityOutlined color="primary" />
            ) : (
              <VisibilityOffOutlined color="disabled" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Uploaded files:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {uploadedFiles.map((file, idx) => (
              <li key={idx}>
                <Typography variant="body2">{file}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {showTips && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Supported file types:</strong>
          </Typography>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>
              <strong>Translation files:</strong> JSON files with translation key-value pairs
            </li>
            <li>
              <strong>JSON Schema files:</strong> Schema files to initialize translation keys
            </li>
          </ul>
          <Typography variant="body2">
            Files will be automatically detected and processed. Existing data will be merged, with conflict resolution
            when needed.
          </Typography>
        </Alert>
      )}
    </Box>
  )
}