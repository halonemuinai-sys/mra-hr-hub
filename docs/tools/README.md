# Word user manual generator

Builds **`docs/HR-HUB-Panduan-Pengguna.docx`**: one Word manual made from the Markdown guides in `docs/guides/` (cover, table of contents, an introduction chapter, then one chapter per menu with its screenshots).

The `.docx` and `.pdf` are generated files and are **not committed** (MS Office files are git-ignored). Rebuild them whenever a guide or screenshot changes.

```powershell
cd "d:\MRA Project\HR HUB\docs\tools"
npm install          # once (docx library)
npm run build        # writes ..\HR-HUB-Panduan-Pengguna.docx
npm run finalize     # Word: fill the table of contents + page numbers, save, export ..\HR-HUB-Panduan-Pengguna.pdf
```

- `npm run finalize` needs Microsoft Word on Windows. Without it, open the `.docx` in Word and choose *References → Update Table* once.
- Chapter order and titles: `CHAPTERS` in `build-manual.js`. The introduction chapter (about HR HUB, roles, flow, glossary) is the `INTRO` text in the same file.
- The converter understands the Markdown used in the guides: headings, paragraphs, **bold** / *italic* / `code`, tables, bullet and numbered lists, `>` notes, code blocks (flow diagrams) and `![caption](images/x.png)` screenshots. Links to another guide become "(Bab n)".
- Adding a guide: create `docs/guides/<folder>/README.md` + `images/`, then add `{ key: '<folder>', title: '…' }` to `CHAPTERS`.
