# Opens the generated manual in Microsoft Word, fills the table of contents and page numbers,
# saves it, and exports a PDF copy. Requires Microsoft Word (Windows).
param([string]$Docx = '..\HR-HUB-Panduan-Pengguna.docx', [string]$Pdf = '..\HR-HUB-Panduan-Pengguna.pdf')
$Docx = (Resolve-Path $Docx).Path
$Pdf = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Pdf))
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx)
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $doc.Save()
  $doc.ExportAsFixedFormat($Pdf, 17)
  "Saved $Docx and $Pdf (" + $doc.ComputeStatistics(2) + " pages)"
  $doc.Close()
} finally { $word.Quit() }
