
# 🌐 JSON i18n Translator

A modern web-based tool to manage multilingual translations from JSON files. It supports importing schemas or translation files, editing translations across multiple languages, resolving conflicts, validating placeholders, and downloading updated files.

## ✨ Features

* Upload JSON translation or schema files
* Add/edit/delete translation keys
* Add/remove supported languages
* Validate placeholder consistency (`${...}` syntax)
* Merge or resolve conflicting keys during import
* Store state using `localStorage`
* Download compiled translation file
* Interactive translation editing interface

---

## 🧩 Project Structure

```
src/
├── App.tsx                   # Main App with state logic
├── components/
│   ├── ConflictResolver.tsx  # Conflict dialog for merging/keeping keys
│   ├── FileUploader.tsx      # Upload component for translation/schema files
│   ├── PlaceholderValidator.tsx # Validates placeholder consistency
│   ├── StorageIndicator.tsx  # Show storage info & clear option
│   └── TranslationEditor.tsx # Editor for multilingual values
├── App.css                   # Minimal styling
├── App.test.tsx             # Basic unit test
└── index.tsx                # Entry point
```

---

## 🛠 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/json-i18n-translator.git
cd json-i18n-translator
```

### 2. Install dependencies

Make sure you have [Node.js](https://nodejs.org/) (v16 or above) and `npm` installed.

```bash
npm install
```

This installs all required dependencies like:

* `react`
* `@mui/material`
* `@mui/icons-material`
* `typescript`

---

## 🚀 Running the App

```bash
npm start
```

* Opens in your browser at `http://localhost:3000`
* Hot-reloads on file changes

---

## 🧪 Running Tests

To run the default React test suite:

```bash
npm test
```

---

## 📦 Build for Production

```bash
npm run build
```

---

## 📁 Sample Files for Testing

You can use the following types of files to test various functionalities:

* ✅ JSON Translation files with multiple languages
* ✅ JSON Schema files with nested structures
* ✅ Conflict test files (to trigger merge/replace dialog)
* ✅ Files with placeholder inconsistencies (`${...}` mismatches)

> See `test_i18n_json_files/` and `conflict_test_files/` directories (if included in repo).

---

## 📄 Notes

* All translations and language info are stored in browser's localStorage.
* Placeholder syntax must use: `${name}`, `${count}`, etc.
* Placeholder validator checks consistency across languages.

---
