# Beyond the Headlines
### Road crash hospitalisations in Australia, 2011–2021

An interactive data story built with **D3.js v7** for COS30045 Data Visualisation (Swinburne University, 2026 HE Semester Aug).

**Live site:** https://mercury.swin.edu.au/cos30045/s105973835/data_story/

---

## Team 3 minutes

| Member |
|---|
| Yati Moe |
| Thant Nyi Nyi Swe |
| Lynn Myat Bhone Htut |

---

## The story

Road deaths make the headlines, but far more Australians are hospitalised after a crash. This site looks at who is being hurt, and how that changed between 2011 and 2021, through four questions:

| # | Question | Chart |
|---|---|---|
| Q1 | How have road crash hospitalisations changed over time? | Line chart |
| Q2 | Which road users are growing fastest? | Indexed line chart (2011 = 100) |
| Q3 | How do hospitalisations differ by age and sex? | [chart type] |
| Q4 | How do rates compare across states, and for First Nations people? | [chart type] |

---

## Data

- **Source:** Bureau of Infrastructure and Transport Research Economics (BITRE), 2023, *Hospitalised Injury*, based on the AIHW National Hospital Morbidity Database.
- **Processing:** Cleaned and reshaped in KNIME (`knime/`), then exported as CSV files to `data/`.

---

## Project structure

```
├── index.html     # Main page
├── css/           # Stylesheets
├── js/            # D3 library and chart scripts
├── data/          # Processed CSV files
├── knime/         # KNIME workflow
└── docs/          # Design Book and slides
```

---

## Running locally

The charts load CSV files, so open the site through a local server rather than double-clicking `index.html`:

```bash
# from the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

Or use the **Live Server** extension in VS Code.
