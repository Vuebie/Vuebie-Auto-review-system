# AIvue to Vuebie Migration Report

This document provides a comprehensive list of all "AIvue" references in the codebase that need to be replaced with "Vuebie" as part of the rebranding process.

## Summary of Changes

- **Total Files to Update**: 7 files
- **Total References to Replace**: 9 text instances (excluding filenames)
- **Files to Rename**: 3 files

## 1. Files to Rename

The following files need to be renamed to replace "aivue" with "vuebie":

| Current Path | New Path |
|-------------|----------|
| `./docs/aivue_v2_system_design.md` | `./docs/vuebie_v2_system_design.md` |
| `./docs/aivue_v2_class_diagram.mermaid` | `./docs/vuebie_v2_class_diagram.mermaid` |
| `./docs/aivue_v2_sequence_diagram.mermaid` | `./docs/vuebie_v2_sequence_diagram.mermaid` |

## 2. Document Content Updates

The following document content needs to be updated:

### `./docs/aivue_v2_system_design.md` (Line 1)

- **Current**: `# AIvue Auto Review System V2 - Architecture Solution Design`
- **Replace with**: `# Vuebie Auto Review System V2 - Architecture Solution Design`

## 3. HTML File Updates

The following HTML content needs to be updated in `./index.html`:

### Line 8
- **Current**: `<title>AIvue Auto Review System V2</title>`
- **Replace with**: `<title>Vuebie Auto Review System V2</title>`

### Line 10
- **Current**: `<meta name="author" content="AIvue" />`
- **Replace with**: `<meta name="author" content="Vuebie" />`

### Line 12
- **Current**: `<meta property="og:title" content="AIvue Auto Review System V2" />`
- **Replace with**: `<meta property="og:title" content="Vuebie Auto Review System V2" />`

## 4. React Component Updates

### `./src/components/layout/Header.tsx` (Line 67)
- **Current**: `AIvue`
- **Replace with**: `Vuebie`
- **Context**: Brand text in header component

### `./src/components/layout/DashboardLayout.tsx` (Line 126)
- **Current**: `AIvue`
- **Replace with**: `Vuebie`
- **Context**: Brand text in dashboard layout

### `./src/components/layout/DashboardLayout.tsx` (Line 188)
- **Current**: `AIvue`
- **Replace with**: `Vuebie`
- **Context**: Duplicate brand text in dashboard layout

### `./src/pages/admin/layouts/AdminLayout.tsx` (Line 121)
- **Current**: `AIvue Admin`
- **Replace with**: `Vuebie Admin`
- **Context**: Admin panel header text

### `./src/pages/admin/layouts/AdminLayout.tsx` (Line 183)
- **Current**: `AIvue Admin`
- **Replace with**: `Vuebie Admin`
- **Context**: Duplicate admin panel text

## 5. Brand Variant Replacements

The following brand variants were identified and need to be replaced:

| Current Variant | Replace With |
|----------------|-------------|
| AIvue Auto Review System V2 | Vuebie Auto Review System V2 |
| AIvue Admin | Vuebie Admin |
| AIvue | Vuebie |

## 6. Verification Process

After completing all replacements, verify the changes with:

```bash
# Check for any remaining "AIvue" references
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec grep -l "AIvue\|aivue" {} \;

# Check for any remaining files with "aivue" in their names
find . -name "*aivue*" -o -name "*AIvue*"
```

## 7. Implementation Plan

1. Update file content (replace all text instances)
2. Rename the documentation files
3. Run verification process to ensure all instances have been replaced
4. Test the application to ensure all UI elements display correctly