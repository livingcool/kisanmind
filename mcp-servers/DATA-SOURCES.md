# KisanMind Data Sources

All data used in KisanMind is from open-source and publicly available sources.
This document provides full attribution for every data source used in the system.

---

## Market Intelligence (mcp-market-intel)

### Mandi Locations

- **Source:** OpenStreetMap
- **License:** Open Database License (ODbL) v1.0
- **URL:** https://www.openstreetmap.org
- **Usage:** Latitude/longitude coordinates for mandi (agricultural market) locations across India
- **Coverage:** 100+ mandis across 20 states

### Price Data

- **Source:** Agmarknet (Agricultural Marketing Information Network), Government of India
- **License:** Open Government Data (OGD) Platform India License
- **URL:** https://agmarknet.gov.in
- **Usage:** Historical average crop prices used as reference data for price estimates
- **Note:** Prices in the system are based on historical Agmarknet averages and MSP notifications.
  Live prices should be verified at the local mandi.

### Crop Economics Data

- **Source:** Indian Council of Agricultural Research (ICAR) open publications
- **License:** Government of India open data
- **URL:** https://icar.org.in
- **Usage:** Average yield per acre, cost of cultivation, growing duration, and variety information

### Minimum Support Prices (MSP)

- **Source:** Commission for Agricultural Costs and Prices (CACP), Government of India
- **License:** Government notifications (public record)
- **URL:** https://cacp.dacnet.nic.in
- **Usage:** MSP rates for kharif and rabi crops (2024-25 season)

---

## Government Schemes (mcp-scheme-intel)

### Central Government Schemes

| Scheme | Official Portal | License |
|--------|----------------|---------|
| PM-KISAN | https://pmkisan.gov.in | Government of India |
| PMFBY | https://pmfby.gov.in | Government of India |
| PMKSY | https://pmksy.gov.in | Government of India |
| e-NAM | https://enam.gov.in | Government of India |
| Soil Health Card | https://soilhealth.dac.gov.in | Government of India |
| SMAM | https://agrimachinery.nic.in | Government of India |
| NABARD/KCC | https://www.nabard.org | Government of India |
| PM-KUSUM | https://mnre.gov.in | Government of India |
| NMSA | https://nmsa.dac.gov.in | Government of India |

### State Government Schemes

| State | Official Source | Portal URL |
|-------|---------------|------------|
| Maharashtra | Dept of Agriculture, Maharashtra | https://mahafarmer.gov.in, https://mahapocra.gov.in |
| Tamil Nadu | Dept of Agriculture, Tamil Nadu | https://www.tnagri.tn.gov.in |
| Karnataka | Raita Mitra Portal | https://raitamitra.karnataka.gov.in |
| Andhra Pradesh | AP Agriculture Dept | https://ysrrythubharosa.ap.gov.in, https://www.apagrisnet.gov.in |
| Telangana | Rythu Bandhu Portal | https://rythubandhu.telangana.gov.in |
| Uttar Pradesh | UP Agriculture Dept | https://upkisankarjrahat.upsdc.gov.in, http://upagriculture.com |
| Gujarat | Gujarat Agriculture Dept | https://agri.gujarat.gov.in, https://ikhedut.gujarat.gov.in |
| Punjab | Punjab Agriculture Dept | https://www.pbagri.gov.in |
| Haryana | Haryana Agriculture Dept | https://fasal.haryana.gov.in, https://agriharyana.gov.in |
| Madhya Pradesh | MP Agriculture Dept | https://mpkrishi.mp.gov.in, https://mpeuparjan.nic.in |
| Rajasthan | Rajasthan Agriculture Portal | https://rajkisan.rajasthan.gov.in |
| West Bengal | Krishak Bandhu Portal | https://krishakbandhu.net |
| Bihar | Bihar Agriculture DBT Portal | https://dbtagriculture.bihar.gov.in |
| Odisha | KALIA Portal | https://kalia.odisha.gov.in |
| Chhattisgarh | RGKNY Portal | https://rgkny.cg.nic.in |
| Jharkhand | MMKAY Portal | https://mmkay.jharkhand.gov.in |
| Assam | Assam Agriculture Dept | https://diaboroagri.assam.gov.in |
| Kerala | Kerala Agriculture Dept | https://keralaagriculture.gov.in |

---

## Geographic Data

### State Boundary Coordinates

- **Source:** OpenStreetMap
- **License:** ODbL (Open Database License)
- **Usage:** Approximate bounding boxes for Indian state identification from lat/lng coordinates
- **Validation:** Cross-checked with government district boundary records

### District Coordinates

- **Source:** OpenStreetMap + data.gov.in administrative boundaries
- **License:** ODbL + Open Government Data
- **Usage:** District-level location identification for scheme matching

---

## Soil Intelligence (mcp-soil-intel)

- **SoilGrids:** https://soilgrids.org (ISRIC, CC-BY 4.0)
- **FAO World Soil Database:** https://www.fao.org/soils-portal (Open Access)
- **OpenLandMap:** https://openlandmap.org (Open Data Commons Open Database License)

## Water Intelligence (mcp-water-intel)

- **WHO GEMS/Water:** https://gemstat.org (Open Access)
- **USGS Water Portal:** https://waterdata.usgs.gov (Public Domain)
- **NASA GRACE:** https://grace.jpl.nasa.gov (Open Access)

## Climate Intelligence (mcp-climate-intel)

- **NASA POWER:** https://power.larc.nasa.gov (Open Access, no key required)
- **Open-Meteo:** https://open-meteo.com (CC-BY 4.0, 10,000 req/day)
- **CHIRPS Rainfall:** https://www.chc.ucsb.edu/data/chirps (Public Domain)
- **NOAA Climate Data:** https://www.ncdc.noaa.gov (Public Domain)

---

## License Compliance

All data is used in compliance with respective licenses:

- **ODbL (OpenStreetMap):** Attribution maintained, share-alike for derived databases
- **Open Government Data (India):** Free to use, share, and build upon
- **CC-BY 4.0:** Attribution maintained in data source citations
- **Public Domain:** No restrictions on use

This project is open-source (MIT License) and uses only open data for
educational and non-commercial purposes. All data sources are properly
attributed above.

---

## Data Freshness Notes

- **Soil/Climate data:** Changes slowly; cached aggressively
- **Market prices:** Based on historical averages; should be refreshed daily in production
- **Government schemes:** Updated periodically; farmers should always verify at local agriculture office
- **MSP rates:** Updated annually based on CACP recommendations

Last updated: 2026-02-14
