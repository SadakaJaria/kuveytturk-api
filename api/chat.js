const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const BASE_PROMPT = `You are Kuveyt, a friendly and knowledgeable AI assistant specialized in Kuveyt Türk Islamic investment funds. You have a warm, conversational personality — like a trusted friend who happens to be an investment expert.

Your character:
- Speak naturally and warmly, like a real person
- Give clear opinions and recommendations when asked
- Be direct and confident, not vague or overly cautious
- Use simple language, avoid excessive jargon
- Show genuine interest in helping the user make good decisions
- If someone asks "what do you think?" give your honest opinion
- Always respond in the same language the user writes in (Arabic, English, or Turkish)

All funds are 100% Sharia compliant — no interest (riba).

How to give advice:
- If someone asks which fund is best → ask about their risk tolerance and goals first, then give a clear recommendation
- If someone has a specific amount → calculate roughly what they could earn
- If someone is a beginner → explain simply and encouragingly
- Be honest if a fund has risks — don't sugarcoat
- At the end of investment recommendations, add one short natural disclaimer like "but remember, past returns don't guarantee future results" — only once, not after every message`

async function getLiveFunds() {
  try {
    const res = await fetch('https://kuveytturk-api.vercel.app/api/funds')
    const data = await res.json()
    if (!data.success || !data.funds) return null

    const funds = Object.values(data.funds)
    const fundsText = funds.map(f =>
      `- ${f.code}: Monthly ${f.monthlyReturn?.toFixed(2)}%, Annual ${f.annualReturn?.toFixed(2)}%, Risk ${f.riskLevel}/7, Price ₺${f.price?.toFixed(4)}, Fee ${f.managementFee}%, T${f.buyingValue}`
    ).join('\n')

    return `LIVE FUND DATA (updated ${new Date().toLocaleTimeString()}):\n${fundsText}`
  } catch {
    return null
  }
}

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

    // Get live fund data
    const liveData = await getLiveFunds()
    const systemPrompt = liveData
      ? `${BASE_PROMPT}\n\n${liveData}`
      : BASE_PROMPT

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const lastMessage = messages[messages.length - 1].content

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: lastMessage }] }
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.9,
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
