# Financial Statement Analysis Assistant

A small web app that analyses an Income Statement, Balance Sheet and Cash Flow Statement for two periods.

- **Exact maths in code:** growth %, percentage changes, margins, ROE, current ratio and debt-to-equity are calculated in `analysis.js`, not by the AI.
- **Missing data handled:** a ratio is shown only when its inputs exist; zero denominators give "not defined" instead of a wrong number.
- **Claude writes the commentary** (summary, insights, areas to review) following the rules in `skill/SKILL.md`. It receives the calculated numbers and never does arithmetic.
- If the AI call fails, the tables still work.

## Files
| File | Purpose |
|---|---|
| `index.html` | The page the user sees |
| `analysis.js` | Calculation engine (browser and server share it) |
| `api/commentary.js` | Serverless function that calls the Claude API |
| `skill/SKILL.md` | The Claude Skill (instructions, formulas, accuracy rules) |
| `test.js` | Checks the maths against the worked example (`node test.js`) |
| `vercel.json`, `package.json` | Deployment config |

## Deploy
1. Upload all files to a GitHub repository, keeping the `api` and `skill` folders.
2. At vercel.com sign in with GitHub, import the repository, leave build settings as they are.
3. Before deploying, add environment variable `ANTHROPIC_API_KEY` (from console.anthropic.com). Set a low monthly spend limit there. Never put the key in the code.
4. Deploy, open the Vercel link, click **Load worked example**, then **Analyse**.

## Test by hand
Worked example: revenue 10,00,000 to 12,00,000 gives +20%; net profit 1,50,000 to 1,80,000 gives +20%; net margin 15%; current ratio 2.00; debt-to-equity 0.40.

## Limits
Two periods, one currency/unit, figures only as entered. Not investment, tax or legal advice.
