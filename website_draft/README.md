# Beyond the Headlines
**A decade of road crash hospitalisations in Australia, 2011–2021**

COS30045 Data Visualisation, Team Project (Team: 3 minutes, Group 1, C1 & T1, 2026 HE Semester Aug)

## Team
- Yati Moe
- Thant Nyi Nyi Swe
- Lynn Myat Bhone Htut

## Data
Bureau of Infrastructure and Transport Research Economics (BITRE), *Hospitalised injury* (September 2023 release),
sourced from the AIHW National Hospital Morbidity Database.
https://www.bitre.gov.au/publications/ongoing/hospitalised-injury

Raw workbooks are processed in KNIME and exported as tidy CSV files into `data/`.

## Folder structure
| Folder | Contents |
|---|---|
| `index.html` | One-page site: Q1 and Q2 charts, Q3 and Q4 planned |
| `js/` | D3 chart scripts |
| `css/` | Styles |
| `data/` | Processed CSV files exported from KNIME |
| `knime/` | KNIME workflow (`.knwf`) |
| `docs/` | Design Book drafts and stand-up slides |

## Live site (Mercury)
https://mercury.swin.edu.au/cos30045/s105973835/project/

## Run locally
Serve the folder with a local web server (e.g. VS Code Live Server) and open `index.html`.
The page loads data with `d3.csv`, so opening the file directly from disk will not work.
D3 v7 is included locally in `js/d3.v7.min.js`.
