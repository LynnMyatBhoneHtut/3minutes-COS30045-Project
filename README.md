# Beyond the Headlines
### Road Crash Hospitalisations in Australia, 2011–2021

An interactive one-page dashboard built with **D3.js v7** for COS30045 Data Visualisation (Swinburne University, 2026 HE Semester Aug).

**Live site:** https://mercury.swin.edu.au/cos30045/s105973835/data_story/

---

## Team 3 minutes

- Yati Moe
- Thant Nyi Nyi Swe
- Lynn Myat Bhone Htut

---

## Overview

Road deaths make the headlines, but far more Australians end up in hospital after a crash. Between 2011 and 2021, **410,884 people** were hospitalised. That is about **100 per day**, and the yearly number rose **16%** over the decade.

The dashboard answers four questions:

| # | Question | Chart | Interaction |
|---|---|---|---|
| Q1 | How have hospitalisations changed each year? | Line chart with notes for data breaks (Vic, NSW) and COVID-19 | Drag the brush below the chart to zoom |
| Q2 | Which road users are growing fastest? | Indexed line chart (2011 = 100) | Click a road user to show or hide its line |
| Q3 | Which age groups are hospitalised most? | Heatmap (age group × year) | Switch between all sexes, female and male |
| Q4 | How does each state compare? | Choropleth map plus a line chart of the selected state | Year slider; click a state to see its trend |
| Q4 | Where do injured people live? | 100% stacked bar: First Nations vs non-Indigenous, by remoteness | Switch between % and count |

### Global filters

**Year**, **Road user**, **Sex** and **Age group** filters update Q1, Q2 and the First Nations chart. **Reset** clears all filters.

---

## Data

- **Source:** Bureau of Infrastructure and Transport Research Economics (BITRE), 2023, *Hospitalised Injury*, based on the AIHW National Hospital Morbidity Database.
- **Processing:** Cleaned and reshaped in KNIME (`knime/`), then exported as CSV files to `data/`.
- **Note:** Figures are counts, not population rates. Series breaks (Vic 2012, NSW 2017, and in the state trend lines) are marked on the charts.

---

## Project structure

```
├── index.html     # Dashboard page
├── css/           # Stylesheets
├── js/            # D3 library and chart scripts
├── data/          # Processed CSV files
├── knime/         # KNIME workflow
└── docs/          # Design Book and slides
```

---

## Running locally

The charts load CSV files, so serve the folder instead of opening `index.html` directly:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Or use the **Live Server** extension in VS Code.
