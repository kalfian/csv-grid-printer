# CSV Grid Printer

A browser-based tool to print CSV data as grid cards on A4 paper. Upload a CSV file, customize the layout and styling per column, then print directly from the browser.

## Features

- **CSV/TSV/TXT support** — auto-detects delimiter (comma, semicolon, tab)
- **Drag & drop** or click to upload
- **Configurable grid layout** — adjust columns and rows per page
- **Per-column settings** — toggle visibility, alignment, font size, and bold per column
- **Title column** — designate one column as the main title (displayed without label prefix)
- **Cell footer** — add custom footer text with configurable position, size, color, and bold
- **Live A4 preview** — see exactly how pages will print, with automatic pagination
- **Border styles** — solid, dashed, or dotted cell borders
- **Print-ready** — uses `@page` CSS for accurate A4 output with no margins

## Usage

1. Open `index.html` in a browser
2. Upload a CSV file (drag & drop or click the upload area)
3. Adjust grid layout (columns x rows per page)
4. Configure per-column settings (visibility, alignment, size, bold)
5. Optionally set a cell footer text
6. Click **Print** or use `Ctrl+P` / `Cmd+P`

## Project Structure

```
csv-printer/
├── index.html   # HTML structure
├── style.css    # All styles (dark sidebar, A4 preview, print styles)
├── app.js       # Application logic (CSV parsing, rendering, event handling)
└── README.md
```

No build tools, no dependencies, no server required — just open the HTML file.

## License

MIT
