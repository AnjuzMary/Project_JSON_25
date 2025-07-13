import React, { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material"
import { Download, Add, Delete, Warning, CheckCircle, Language, Key } from "@mui/icons-material"
import { TranslationEditor } from "./components/TranslationEditor"
import { FileUploader } from "./components/FileUploader"
import { ConflictResolver } from "./components/ConflictResolver"
import { PlaceholderValidator } from "./components/PlaceholderValidator"
import { StorageIndicator } from "./components/StorageIndicator";
import './App.css'

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
})

interface TranslationData {
  [key: string]: {
    [language: string]: string
  }
}

interface SchemaProperty {
  type: string
  properties?: { [key: string]: SchemaProperty }
  title?: string
  description?: string
  items?: SchemaProperty
  oneOf?: SchemaProperty[]
  anyOf?: SchemaProperty[]
  allOf?: SchemaProperty[]
}

interface JsonSchema {
  properties?: { [key: string]: SchemaProperty }
  title?: string
  description?: string
}

function App() {
  const [translations, setTranslations] = useState<TranslationData>({})
  const [languages, setLanguages] = useState<string[]>(["en"])
  const [selectedKey, setSelectedKey] = useState<string>("")
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [showAddLanguageDialog, setShowAddLanguageDialog] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [conflicts, setConflicts] = useState<any>(null)
  const [placeholderIssues, setPlaceholderIssues] = useState<any>({})
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);


  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("i18n-translations");
    const savedLanguages = localStorage.getItem("i18n-languages");

    if (savedData) {
      try {
        setTranslations(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load saved translations:", e);
      }
    }

    if (savedLanguages) {
      try {
        setLanguages(JSON.parse(savedLanguages));
      } catch (e) {
        console.error("Failed to load saved languages:", e);
      }
    }

    setHasLoadedFromStorage(true); // ✅ mark storage as loaded
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (hasLoadedFromStorage) {
      localStorage.setItem("i18n-translations", JSON.stringify(translations));
    }
  }, [translations, hasLoadedFromStorage]);

  useEffect(() => {
    if (hasLoadedFromStorage) {
      localStorage.setItem("i18n-languages", JSON.stringify(languages));
    }
  }, [languages, hasLoadedFromStorage]);


  // Validate placeholders whenever translations change
  useEffect(() => {
    const issues: any = {}
    Object.keys(translations).forEach((key) => {
      const keyTranslations = translations[key]
      const placeholders = extractPlaceholders(Object.values(keyTranslations))

      if (placeholders.length > 0) {
        const inconsistencies = findPlaceholderInconsistencies(keyTranslations, placeholders)
        if (inconsistencies.length > 0) {
          issues[key] = inconsistencies
        }
      }
    })
    setPlaceholderIssues(issues)
  }, [translations])

  const extractPlaceholders = (texts: string[]): string[] => {
    const placeholders = new Set<string>()
    texts.forEach((text) => {
      const matches = text.match(/\$\{([^}]+)\}/g)
      if (matches) {
        matches.forEach((match) => placeholders.add(match))
      }
    })
    return Array.from(placeholders)
  }

  const findPlaceholderInconsistencies = (
    keyTranslations: { [lang: string]: string },
    expectedPlaceholders: string[],
  ) => {
    const inconsistencies: string[] = []

    Object.entries(keyTranslations).forEach(([lang, text]) => {
      const textPlaceholders = extractPlaceholders([text])
      const missing = expectedPlaceholders.filter((p) => !textPlaceholders.includes(p))
      const extra = textPlaceholders.filter((p) => !expectedPlaceholders.includes(p))

      if (missing.length > 0 || extra.length > 0) {
        inconsistencies.push(`${lang}: missing ${missing.join(", ")}, extra ${extra.join(", ")}`)
      }
    })

    return inconsistencies
  }

  const handleFileUpload = (data: any, type: "translation" | "schema") => {
    if (type === "translation") {
      // Check for conflicts
      const existingKeys = Object.keys(translations)
      const newKeys = Object.keys(data)
      const conflictingKeys = existingKeys.filter((key) => newKeys.includes(key))

      if (conflictingKeys.length > 0) {
        setConflicts({
          existing: translations,
          incoming: data,
          conflictingKeys,
        })
      } else {
        mergeTranslations(data)
      }
    } else if (type === "schema") {
        const keys = extractKeysFromSchema(data)
        const newTranslations = { ...translations }

        keys.forEach((key) => {
          if (!newTranslations[key]) {
            newTranslations[key] = {}

            // Try to pull fallback value from schema
            const fallback = getSchemaValueByPath(data, key)

            languages.forEach((lang) => {
              newTranslations[key][lang] = fallback || ""
            })
          }
        })

        setTranslations(newTranslations)
      }
  }

  const extractKeysFromSchema = (schema: JsonSchema): string[] => {
  const keys: string[] = []

  const traverse = (obj: any, path = "") => {
    const currentPath = path

    // Add title and description at current path
    if (obj.title !== undefined) {
      keys.push(`${currentPath}${currentPath ? '.' : ''}title`)
    }
    if (obj.description !== undefined) {
      keys.push(`${currentPath}${currentPath ? '.' : ''}description`)
    }

    // Recurse into properties
    if (obj.properties) {
      Object.entries(obj.properties).forEach(([key, prop]: [string, any]) => {
        traverse(prop, `${currentPath}${currentPath ? '.' : ''}properties.${key}`)
      })
    }

    // Recurse into items of arrays
    if (obj.type === "array" && obj.items) {
      traverse(obj.items, `${currentPath}${currentPath ? '.' : ''}items`)
    }

    // Handle oneOf, anyOf, allOf
    ["oneOf", "anyOf", "allOf"].forEach((schemaType) => {
      if (Array.isArray(obj[schemaType])) {
        obj[schemaType].forEach((sub: any, index: number) => {
          traverse(sub, `${currentPath}${currentPath ? '.' : ''}${schemaType}.${index}`)
        })
      }
    })
  }

  traverse(schema)
  return keys
}

function getSchemaValueByPath(schema: any, path: string): string | undefined {
  const parts = path.split(".");
  let current = schema;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current) return undefined;

    if (["properties", "items", "oneOf", "anyOf", "allOf"].includes(part)) {
      const next = parts[i + 1];
      if (["oneOf", "anyOf", "allOf"].includes(part)) {
        current = current[part]?.[parseInt(next)];
        i++; // Skip index
      } else {
        current = current[part]?.[next];
        i++; // Skip key
      }
    }
  }

  const lastPart = parts[parts.length - 1];
  return current?.[lastPart];
}

  const mergeTranslations = (newData: TranslationData) => {
    const merged = { ...translations }
    const newLanguages = new Set(languages)

    Object.keys(newData).forEach((key) => {
      if (!merged[key]) {
        merged[key] = {}
      }

      Object.keys(newData[key]).forEach((lang) => {
        merged[key][lang] = newData[key][lang]
        newLanguages.add(lang)
      })
    })

    setTranslations(merged)
    setLanguages(Array.from(newLanguages))
  }

  const handleConflictResolution = (resolution: "keep" | "replace" | "merge", conflictingKeys: string[]) => {
    if (!conflicts) return

    const merged = { ...translations }

    conflictingKeys.forEach((key) => {
      if (resolution === "replace") {
        merged[key] = conflicts.incoming[key]
      } else if (resolution === "merge") {
        merged[key] = { ...merged[key], ...conflicts.incoming[key] }
      }
      // 'keep' does nothing
    })

    // Add non-conflicting keys
    Object.keys(conflicts.incoming).forEach((key) => {
      if (!conflictingKeys.includes(key)) {
        merged[key] = conflicts.incoming[key]
      }
    })

    setTranslations(merged)
    setConflicts(null)
  }

  const addKey = () => {
    if (newKey && !translations[newKey]) {
      const newTranslations = { ...translations }
      newTranslations[newKey] = {}
      languages.forEach((lang) => {
        newTranslations[newKey][lang] = ""
      })
      setTranslations(newTranslations)
      setNewKey("")
      setShowAddKeyDialog(false)
    }
  }

  const deleteKey = (key: string) => {
    const newTranslations = { ...translations }
    delete newTranslations[key]
    setTranslations(newTranslations)
    if (selectedKey === key) {
      setSelectedKey("")
    }
  }

  const addLanguage = () => {
    if (newLanguage && !languages.includes(newLanguage)) {
      const newLanguages = [...languages, newLanguage]
      const newTranslations = { ...translations }

      Object.keys(newTranslations).forEach((key) => {
        newTranslations[key][newLanguage] = ""
      })

      setLanguages(newLanguages)
      setTranslations(newTranslations)
      setNewLanguage("")
      setShowAddLanguageDialog(false)
    }
  }

  const deleteLanguage = (language: string) => {
    if (languages.length <= 1) return // Keep at least one language

    const newLanguages = languages.filter((lang) => lang !== language)
    const newTranslations = { ...translations }

    Object.keys(newTranslations).forEach((key) => {
      delete newTranslations[key][language]
    })

    setLanguages(newLanguages)
    setTranslations(newTranslations)
  }

  const clearStorage = () => {
    if (window.confirm("Are you sure you want to clear all translation data?")) {
      localStorage.removeItem("i18n-translations")
      localStorage.removeItem("i18n-languages")
      setTranslations({})
      setLanguages(["en"])
      setSelectedKey("")
    }
  }

  const updateTranslation = (key: string, language: string, value: string) => {
    const newTranslations = { ...translations }
    if (!newTranslations[key]) {
      newTranslations[key] = {}
    }
    newTranslations[key][language] = value
    setTranslations(newTranslations)
  }

  const downloadTranslations = () => {
    const dataStr = JSON.stringify(translations, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "i18n.data.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const getKeyCompletionStatus = (key: string) => {
    const keyTranslations = translations[key]
    const completed = languages.filter(
      (lang) => (keyTranslations?.[lang] ?? "").toString().trim() !== ""
    )
    return {
      completed: completed.length,
      total: languages.length,
      isComplete: completed.length === languages.length,
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" sx={{ mb: 3 }}>
            <Toolbar>
              <Language sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                JSON i18n Translator
              </Typography>

              <StorageIndicator onClearStorage={clearStorage} />

              <Button
                color="inherit"
                startIcon={<Download />}
                onClick={downloadTranslations}
                disabled={Object.keys(translations).length === 0}
                sx={{ ml: 2 }}
              >
                Download
              </Button>
            </Toolbar>
          </AppBar>


          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {/* File Upload Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    File Upload
                  </Typography>
                  <FileUploader onFileUpload={handleFileUpload} />
                </Paper>
              </Grid>

              {/* Languages Management */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Languages
                    </Typography>
                    <Button startIcon={<Add />} onClick={() => setShowAddLanguageDialog(true)} size="small">
                      Add Language
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {languages.map((lang) => (
                      <Chip
                        key={lang}
                        label={lang.toUpperCase()}
                        onDelete={languages.length > 1 ? () => deleteLanguage(lang) : undefined}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Keys Management */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Translation Keys
                    </Typography>
                    <Button startIcon={<Add />} onClick={() => setShowAddKeyDialog(true)} size="small">
                      Add Key
                    </Button>
                  </Box>
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {Object.keys(translations).map((key) => {
                      const status = getKeyCompletionStatus(key)
                      const hasPlaceholderIssues = placeholderIssues[key]

                      return (
                        <Box
                          key={key}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 1,
                            cursor: "pointer",
                            bgcolor: selectedKey === key ? "action.selected" : "transparent",
                            "&:hover": { bgcolor: "action.hover" },
                            borderRadius: 1,
                            mb: 0.5,
                          }}
                          onClick={() => setSelectedKey(key)}
                        >
                          <Key sx={{ mr: 1, fontSize: 16 }} />
                          <Typography sx={{ flexGrow: 1 }}>{key}</Typography>
                          {hasPlaceholderIssues && (
                            <Tooltip title="Placeholder inconsistencies">
                              <Warning color="warning" sx={{ mr: 1 }} />
                            </Tooltip>
                          )}
                          {status.isComplete ? (
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              {status.completed}/{status.total}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteKey(key)
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    })}
                  </Box>
                </Paper>
              </Grid>

              {/* Translation Editor */}
              {selectedKey && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Editing: {selectedKey}
                    </Typography>
                    {placeholderIssues[selectedKey] && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Placeholder inconsistencies detected:
                        <ul>
                          {placeholderIssues[selectedKey].map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}
                    <TranslationEditor
                      translationKey={selectedKey}
                      languages={languages}
                      translations={translations[selectedKey] || {}}
                      onTranslationChange={updateTranslation}
                    />
                  </Paper>
                </Grid>
              )}

              {/* Placeholder Validator */}
              <Grid item xs={12}>
                <PlaceholderValidator translations={translations} placeholderIssues={placeholderIssues} />
              </Grid>
            </Grid>

            {/* Add Key Dialog */}
            <Dialog open={showAddKeyDialog} onClose={() => setShowAddKeyDialog(false)}>
              <DialogTitle>Add New Translation Key</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Key Name"
                  fullWidth
                  variant="outlined"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addKey()}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowAddKeyDialog(false)}>Cancel</Button>
                <Button onClick={addKey} disabled={!newKey || !!translations[newKey]}>
                  Add
                </Button>
              </DialogActions>
            </Dialog>

            {/* Add Language Dialog */}
            <Dialog open={showAddLanguageDialog} onClose={() => setShowAddLanguageDialog(false)}>
              <DialogTitle>Add New Language</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Language Code (e.g., de, fr, es)"
                  fullWidth
                  variant="outlined"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value.toLowerCase())}
                  onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowAddLanguageDialog(false)}>Cancel</Button>
                <Button onClick={addLanguage} disabled={!newLanguage || languages.includes(newLanguage)}>
                  Add
                </Button>
              </DialogActions>
            </Dialog>

            {/* Conflict Resolution Dialog */}
            {conflicts && (
              <ConflictResolver
                conflicts={conflicts}
                onResolve={handleConflictResolution}
                onCancel={() => setConflicts(null)}
              />
            )}
          </Container>
        </Box>
      </div>
    </ThemeProvider>
  )
}

export default App