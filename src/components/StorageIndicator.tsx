import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Save, Delete, Storage } from "@mui/icons-material";

interface StorageIndicatorProps {
  onClearStorage: () => void;
}

export function StorageIndicator({ onClearStorage }: StorageIndicatorProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [storageSize, setStorageSize] = useState<string>("0 KB");
  const [storageQuota, setStorageQuota] = useState<{
    quota?: number;
    usage?: number;
  }>({});

  // Calculate storage size in a debounced manner
  const calculateStorageSize = useCallback(() => {
    try {
      const translations = localStorage.getItem("i18n-translations") || "";
      const languages = localStorage.getItem("i18n-languages") || "";
      const totalSize = new Blob([translations + languages]).size;

      if (totalSize < 1024) {
        setStorageSize(`${totalSize} B`);
      } else if (totalSize < 1024 * 1024) {
        setStorageSize(`${(totalSize / 1024).toFixed(1)} KB`);
      } else {
        setStorageSize(`${(totalSize / (1024 * 1024)).toFixed(1)} MB`);
      }
    } catch (error) {
      console.error("Storage calculation failed:", error);
      setStorageSize("Error");
    }
  }, []);

  // Check storage quota if available
  const checkStorageQuota = useCallback(async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setStorageQuota({
          quota: estimate.quota,
          usage: estimate.usage,
        });
      } catch (error) {
        console.error("Storage quota check failed:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Initial setup
    calculateStorageSize();
    checkStorageQuota();

    // Set initial last saved time if data exists
    const savedData = localStorage.getItem("i18n-translations");
    if (savedData) {
      setLastSaved(new Date());
    }

    // Listen for storage changes with debounce
    let debounceTimer: NodeJS.Timeout;
    const handleStorageChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setLastSaved(new Date());
        calculateStorageSize();
      }, 500);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [calculateStorageSize, checkStorageQuota]);

  const handleClearStorage = () => {
    localStorage.removeItem("i18n-translations");
    localStorage.removeItem("i18n-languages");
    onClearStorage();
    setLastSaved(null);
    setStorageSize("0 KB");
    setStorageQuota({});
    setShowClearDialog(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Determine chip color based on storage usage
  const getStorageChipColor = () => {
    if (!storageQuota.quota || !storageQuota.usage) return "primary";
    const usagePercentage = storageQuota.usage / storageQuota.quota;
    return usagePercentage > 0.9 ? "warning" : "primary";
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip
        title={
          storageQuota.quota
            ? `Using ${storageSize} of ${(
                storageQuota.quota /
                (1024 * 1024)
              ).toFixed(1)} MB available`
            : `Data size: ${storageSize}`
        }
      >
        <Chip
          icon={<Storage />}
          label={storageSize}
          size="small"
          variant="outlined"
          color={getStorageChipColor()}
        />
      </Tooltip>

      {lastSaved && (
        <Tooltip title={`Last auto-saved at ${formatTime(lastSaved)}`}>
          <Chip
            icon={<Save />}
            label={`Saved ${formatTime(lastSaved)}`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Tooltip>
      )}

      <Tooltip title="Clear all stored data">
        <IconButton
          size="small"
          onClick={() => setShowClearDialog(true)}
          color="error"
          aria-label="Clear storage"
        >
          <Delete />
        </IconButton>
      </Tooltip>

      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear Local Storage</DialogTitle>
        <DialogContent>
          Are you sure you want to clear all stored translation data? This action
          cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClearStorage} color="error" variant="contained">
            Clear Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}