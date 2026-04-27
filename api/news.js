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

  const prompts = {
    ar: `ابحث الآن في الإنترنت عن آخر أخبار كويت ترك وصناديق المشاركة الإسلامية في تركيا.

بعد البحث، أعطني النتائج بصيغة JSON فقط، بدون أي نص قبله أو بعده، بهذا الشكل بالضبط:
{"news":[{"title":"عنوان الخبر","summary":"ملخص جملتين","source":"اسم المصدر","date":"التاريخ","category":"صناديق أو اقتصاد أو ذهب أو عملات أو إسلامي","url":"رابط الخبر إن وجد"}]}`,

    en: `Search the internet now for the latest news about Kuveyt Türk and Islamic participation funds in Turkey.

After searching, return results as JSON only, no text before or after:
{"news":[{"title":"title","summary":"two sentence summary","source":"source name","date":"date","category":"funds or economy or gold or currencies or islamic","url":"article url if available"}]}`,

    tr: `Kuveyt Türk ve Türkiye'deki İslami katılım fonları hakkında internette şimdi ara.

Aradıktan sonra, önce veya sonra metin olmadan yalnızca JSON döndür:
{"news":[{"title":"başlık","summary":"iki cümle özet","source":"kaynak adı","date":"tarih","category":"fonlar veya ekonomi veya altın veya döviz veya islami","url":"makale url varsa"}]}`
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompts[lang] || prompts.ar }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            maxOutputTokens: 3000,
            temperature: 0.1
          }
        })
      }
    )

    const data = await geminiRes.json()

    // Try all parts — Gemini sometimes puts JSON in different parts
    const parts = data.candidates?.[0]?.content?.parts || []
    let text = ''
    for (const part of parts) {
      if (part.text) text += part.text
    }

    // Try to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*"news"[\s\S]*\}/)
    if (!jsonMatch) {
      // Return raw for debugging
      return res.status(500).json({ success: false, error: 'No JSON found', raw: text.slice(0, 500) })
    }

    const parsed = JSON.parse(jsonMatch[0])
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ success: true, ...parsed, generatedAt: new Date().toISOString() })

  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
