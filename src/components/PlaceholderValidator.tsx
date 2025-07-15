import React from "react"
import { Paper, Typography, Box, Alert, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material"
import { ExpandMore, Warning } from "@mui/icons-material"

interface PlaceholderValidatorProps {
  translations: { [key: string]: { [language: string]: string } }
  placeholderIssues: { [key: string]: string[] }
}

export function PlaceholderValidator({ translations, placeholderIssues }: PlaceholderValidatorProps) {
  const issueCount = Object.keys(placeholderIssues).length

  if (issueCount === 0) {
    return null
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Warning color="warning" sx={{ mr: 1 }} />
        <Typography variant="h6">Placeholder Validation Issues</Typography>
        <Chip label={`${issueCount} keys with issues`} color="warning" size="small" sx={{ ml: 2 }} />
      </Box>

      <Alert severity="warning" sx={{ mb: 2 }}>
        The following translation keys have inconsistent placeholder usage across languages. All translations for a key
        should use the same placeholders.
      </Alert>

      {Object.entries(placeholderIssues).map(([key, issues]) => (
        <Accordion key={key}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              {key} ({issues.length} issues)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current translations:
              </Typography>
              {Object.entries(translations[key] || {}).map(([lang, text]) => (
                <Box key={lang} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {lang.toUpperCase()}:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", bgcolor: "grey.100", p: 1, borderRadius: 1 }}
                  >
                    {text || "(empty)"}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Issues detected:
            </Typography>
            <ul>
              {issues.map((issue, index) => (
                <li key={index}>
                  <Typography variant="body2" color="error">
                    {issue}
                  </Typography>
                </li>
              ))}
            </ul>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  )
}