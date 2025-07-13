import React, { useRef } from "react"
import { Box, Button, Typography, Alert } from "@mui/material"
import { Upload } from "@mui/icons-material"

interface FileUploaderProps {
  onFileUpload: (data: any, type: "translation" | "schema") => void
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

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      </Box>

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
    </Box>
  )
}