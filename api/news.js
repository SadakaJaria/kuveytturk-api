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
    ar: `ابحث عن آخر 8 أخبار حديثة عن "كويت ترك" أو "Kuveyt Türk" أو صناديق الاستثمار الإسلامية في تركيا خلال الأيام الماضية.
    
    أعد النتيجة كـ JSON فقط بدون أي نص إضافي أو markdown، بهذا الشكل:
    {
      "news": [
        {
          "title": "عنوان الخبر بالعربي",
          "summary": "ملخص الخبر بالعربي في جملتين",
          "source": "اسم المصدر",
          "date": "تاريخ تقريبي",
          "category": "واحدة من: صناديق | اقتصاد | ذهب | عملات | إسلامي"
        }
      ]
    }`,
    en: `Search for the latest 8 news about "Kuveyt Türk" or Islamic investment funds in Turkey from recent days.
    
    Return only JSON without any extra text or markdown:
    {
      "news": [
        {
          "title": "News title in English",
          "summary": "Two sentence summary in English",
          "source": "Source name",
          "date": "Approximate date",
          "category": "One of: funds | economy | gold | currencies | islamic"
        }
      ]
    }`,
    tr: `Kuveyt Türk veya Türkiye'deki İslami yatırım fonları hakkında son günlerden 8 güncel haber ara.
    
    Sadece JSON döndür, başka metin veya markdown olmadan:
    {
      "news": [
        {
          "title": "Türkçe haber başlığı",
          "summary": "İki cümlelik Türkçe özet",
          "source": "Kaynak adı",
          "date": "Yaklaşık tarih",
          "category": "Şunlardan biri: fonlar | ekonomi | altın | döviz | islami"
        }
      ]
    }`
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
          generationConfig: { maxOutputTokens: 2000, temperature: 0.3 }
        })
      }
    )

    const data = await geminiRes.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ success: true, ...parsed })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
