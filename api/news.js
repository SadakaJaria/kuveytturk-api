const GEMINI_API_KEY = process.env.GEMINI_API_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://sadakajaria.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const lang = req.query.lang || 'ar'
  let jsonText = ''

  try {
    const searchRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: lang === 'ar'
              ? 'ابحث عن آخر أخبار كويت ترك وصناديق الاستثمار الإسلامية في تركيا وأعطني قائمة بالأخبار مع عناوينها وملخصاتها ومصادرها'
              : lang === 'tr'
              ? 'Kuveyt Türk ve Türkiye İslami yatırım fonları hakkında son haberleri ara ve listele'
              : 'Search for latest news about Kuveyt Türk and Islamic investment funds in Turkey and list them with titles, summaries and sources'
            }]
          }],
          tools: [{ googleSearch: {} }],
          generationConfig: { maxOutputTokens: 3000, temperature: 0.1 }
        })
      }
    )

    const searchData = await searchRes.json()
    const rawText = searchData.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join('') || ''

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: 'Empty response from Gemini',
        debug: JSON.stringify(searchData).slice(0, 300)
      })
    }

    const convertRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `حوّل هذا النص إلى JSON فقط بدون أي نص إضافي:
{"news":[{"title":"...","summary":"...","source":"...","date":"...","category":"صناديق أو اقتصاد أو ذهب أو عملات أو إسلامي"}]}
النص:
${rawText.slice(0, 2000)}` }]
          }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    const convertData = await convertRes.json()
    jsonText = convertData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = jsonText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ success: true, ...parsed, generatedAt: new Date().toISOString() })

  } catch (err) {
    res.status(500).json({ success: false, error: err.message, raw: jsonText.slice(0, 500) })
  }
}
