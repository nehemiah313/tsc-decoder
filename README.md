# TSC Criteria Decoder

Plain-English explorer for the SOC 2 Trust Services Criteria (61 criteria), plus a scoping quiz that recommends which categories likely belong in your SOC 2 engagement scope.

Part of the [AI Tech Pros SOC 2 readiness suite](https://github.com/nehemiah313/tsc-dataset). Data comes from `data/tsc.json` (criterion IDs verified against the AICPA 2017 Trust Services Criteria; summaries and evidence suggestions are original plain-English guidance).

## Features

- **Explorer**: search by ID, title, or keyword; filter by category, series, and priority. Click any criterion for a detail card with plain-English summary, why the series matters, and typical evidence.
- **Scoping Quiz**: six plain-English questions produce a recommended in-scope category list with reasoning. Security is always in scope. Quiz answers are stored locally in the browser only.
- **Compare**: criterion counts per category and series.

## Run locally

No build step, no backend, no CDNs. Open `index.html` in a browser (or serve with `python3 -m http.server` for `fetch` to load `data/tsc.json` under strict browsers).

## Disclaimer

Educational aid only. Not an audit, attestation, CPA opinion, or legal advice. Confirm your engagement scope with a licensed CPA firm.

## License

MIT. See LICENSE.
