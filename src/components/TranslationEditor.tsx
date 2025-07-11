import React from "react"
import { Box, TextField, Grid, Typography, Chip, Paper } from "@mui/material"

interface TranslationEditorProps {
  translationKey: string
  languages: string[]
  translations: { [language: string]: string }
  onTranslationChange: (key: string, language: string, value: string) => void
}

export function TranslationEditor({
  translationKey,
  languages,
  translations,
  onTranslationChange,
}: TranslationEditorProps) {
  const highlightPlaceholders = (text: string) => {
    return text.replace(
      /(\$\{[^}]+\})/g,
      '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>',
    )
  }

  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\$\{([^}]+)\}/g)
    return matches || []
  }

  return (
    <Grid container spacing={2}>
      {languages.map((language) => {
        const value = translations[language] || ""
        const placeholders = extractPlaceholders(value)

        return (
          <Grid item xs={12} md={6} key={language}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle1" gutterBottom>
                {language.toUpperCase()}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                value={value}
                onChange={(e) => onTranslationChange(translationKey, language, e.target.value)}
                variant="outlined"
                placeholder={`Enter ${language} translation...`}
                sx={{ mb: 2 }}
              />

              {/* Preview with highlighted placeholders */}
              {value && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Preview:
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                      minHeight: 40,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightPlaceholders(value),
                    }}
                  />
                </Box>
              )}

              {/* Show placeholders */}
              {placeholders.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Placeholders:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {placeholders.map((placeholder, index) => (
                      <Chip key={index} label={placeholder} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}