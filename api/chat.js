const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const SYSTEM_PROMPT = `You are an expert Islamic investment funds assistant for Kuveyt Türk Asset Management platform. You help users understand and choose between participation (Islamic) investment funds.

You have deep knowledge about all 23 Kuveyt Türk funds:

TL FUNDS (Low Risk - Level 1):
- KLU: Money Market Participation Fund - Monthly: 3.13%, Annual: 44.97%, T+0
- KSV: Short Term Participation Hedge Fund - Monthly: 2.91%, Annual: 44.1%, T+0  
- KTV: Short Term Lease Certificates Fund - Monthly: 2.88%, Annual: 44.2%, T+0
- KTN: Sukuk Participation Fund - Monthly: 2.67%, Annual: 43.19%, T+0
- KTR: First Participation Hedge Fund - Monthly: 2.99%, Annual: 46.84%, T+0

FOREIGN CURRENCY FUNDS (High Risk - Level 6):
- KDL: Fifth Participation Hedge (USD) - Monthly: 1.7%, Annual: 19.79%, T+1
- KTT: Fourth Participation Hedge (USD) - Monthly: 2.94%, Annual: 27.53%, T+1
- KPD: Dividend Paying Participation (USD) - Monthly: 3.01%, Annual: 21.72%, T+1
- KAV: Sixth Participation Hedge (EUR) - Monthly: 3.62%, Annual: 21.1%, T+1

MULTI-ASSET FUNDS:
- KCV: Multi-Asset Participation Fund - Risk 2, Monthly: 6.33%, Annual: 59.27%, T+1
- KTM: First Participation TL Fund - Risk 3, Monthly: 5.32%, Annual: 49.49%, T+1

DOMESTIC STOCKS (High Risk - Level 6):
- KPC: Participation Equity Fund - Monthly: 9.07%, Annual: 63.59%, T+2
- KPU: Second Participation Stock Fund - Monthly: 9.39%, Annual: 49.51%, T+2
- KPA: Dividend Paying Participation Equity - Monthly: 5.45%, Annual: 44.86%, T+2
- KTS: Participation Equity Hedge Fund - Risk 4, Monthly: 9.27%, Annual: 49.33%, T+2

FOREIGN STOCKS:
- KTJ: Technology Participation Fund - Risk 6, Monthly: 11.17%, Annual: 86.43%, T+3
- KNJ: Energy Participation Fund - Risk 5, Monthly: 3.73%, Annual: 79.36%, T+3
- KSR: Sustainability Participation Fund - Risk 5, Monthly: 9.22%, Annual: 60.87%, T+3

VARIABLE FUNDS:
- KME: Cautiously Participation Fund - Risk 2, Monthly: 3.52%, Annual: 47.51%, T+1
- KDE: Balanced Participation Fund - Risk 3, Monthly: 5.27%, Annual: 55.66%, T+1
- KUD: Dynamic Participation Fund - Risk 3, Monthly: 6.87%, Annual: 51.8%, T+1
- KUA: Aggressive Participation Fund - Risk 5, Monthly: 7.12%, Annual: 40.09%, T+2

PRECIOUS METALS (High Risk - Level 6):
- KZL: Gold Participation Fund - Monthly: -3.32%, Annual: 64.71%, T+1
- KZU: Second Gold Participation Fund - Monthly: -3.27%, Annual: 53.86%, T+1
- KUT: Precious Metals Participation Fund - Monthly: -0.79%, Annual: 105.83%, T+1
- KGM: Silver Participation Fund - Monthly: 6.63%, Annual: 161.67%, T+1

All funds are 100% Sharia compliant (no interest/riba). They use Islamic finance instruments: lease certificates (sukuk), participation accounts, and murabaha contracts.

IMPORTANT RULES:
- Always respond in the same language the user writes in (Arabic, English, or Turkish)
- Be concise but informative
- Never give financial advice - always say these are informational only
- For risk assessment: Level 1-2 = Low, 3-4 = Medium, 5-6 = High
- Always remind users to consult a financial advisor for investment decisions
- If asked to compare funds, present a clear comparison table in text format`

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://sadakajaria.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request' })
      return
    }

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const lastMessage = messages[messages.length - 1].content

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: lastMessage }] }
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        })
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      console.error('Gemini error:', err)
      res.status(500).json({ error: 'Gemini API error' })
      return
    }

    const data = await geminiRes.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    res.status(200).json({ reply: text })

  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
