# kuveytturk-api

Vercel API proxy for Kuveyt Türk investment funds data.

## Endpoint

`GET /api/funds` — Returns live prices and returns for all 23 funds.

## Response

```json
{
  "success": true,
  "updatedAt": "2026-04-22T...",
  "funds": {
    "KLU": {
      "code": "KLU",
      "price": 4.262587,
      "monthlyReturn": 3.13,
      "annualReturn": 44.97,
      ...
    }
  }
}
```

## Deploy

1. Push to GitHub
2. Import to Vercel
3. Deploy
