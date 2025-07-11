import React, { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
} from "@mui/material"

interface ConflictResolverProps {
  conflicts: {
    existing: any
    incoming: any
    conflictingKeys: string[]
  }
  onResolve: (resolution: "keep" | "replace" | "merge", conflictingKeys: string[]) => void
  onCancel: () => void
}

export function ConflictResolver({ conflicts, onResolve, onCancel }: ConflictResolverProps) {
  const [resolution, setResolution] = useState<"keep" | "replace" | "merge">("merge")

  const handleResolve = () => {
    onResolve(resolution, conflicts.conflictingKeys)
  }

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Resolve Translation Conflicts</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          The uploaded file contains {conflicts.conflictingKeys.length} keys that already exist in your current
          translations. How would you like to handle these conflicts?
        </Typography>

        <RadioGroup
          value={resolution}
          onChange={(e) => setResolution(e.target.value as "keep" | "replace" | "merge")}
          sx={{ my: 2 }}
        >
          <FormControlLabel
            value="keep"
            control={<Radio />}
            label="Keep existing translations (ignore uploaded conflicts)"
          />
          <FormControlLabel value="replace" control={<Radio />} label="Replace with uploaded translations" />
          <FormControlLabel
            value="merge"
            control={<Radio />}
            label="Merge translations (combine both, uploaded takes precedence for duplicates)"
          />
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Conflicting Keys Preview:
        </Typography>

        <Box sx={{ maxHeight: 300, overflow: "auto" }}>
          {conflicts.conflictingKeys.slice(0, 5).map((key) => (
            <Paper key={key} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Key: {key}
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Existing:
                  </Typography>
                  <Box sx={{ bgcolor: "grey.100", p: 1, borderRadius: 1 }}>
                    <pre style={{ margin: 0, fontSize: "12px" }}>
                      {JSON.stringify(conflicts.existing[key], null, 2)}
                    </pre>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Incoming:
                  </Typography>
                  <Box sx={{ bgcolor: "grey.100", p: 1, borderRadius: 1 }}>
                    <pre style={{ margin: 0, fontSize: "12px" }}>
                      {JSON.stringify(conflicts.incoming[key], null, 2)}
                    </pre>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
          {conflicts.conflictingKeys.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              ... and {conflicts.conflictingKeys.length - 5} more conflicts
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleResolve} variant="contained">
          Resolve Conflicts
        </Button>
      </DialogActions>
    </Dialog>
  )
}