import React, { useRef } from "react"
import { Box, Button, Typography, Alert } from "@mui/material"
import { Upload } from "@mui/icons-material"

interface FileUploaderProps {
  onFileUpload: (data: any, type: "translation" | "schema") => void
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
        const data = JSON.parse(content)

        // Determine file type based on structure
        const isSchema = data.properties || data.$schema || data.type === "object"
        const type = isSchema ? "schema" : "translation"

        onFileUpload(data, type)
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