module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://sadakajaria.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Get USD/TRY and EUR/TRY
    const ratesRes = await fetch('https://api.frankfurter.app/latest?from=TRY&to=USD,EUR')
    const ratesData = await ratesRes.json()

    const usdTry = ratesData.rates?.USD ? (1 / ratesData.rates.USD).toFixed(2) : null
    const eurTry = ratesData.rates?.EUR ? (1 / ratesData.rates.EUR).toFixed(2) : null

    // Get Gold in TRY directly
    const goldRes = await fetch('https://api.frankfurter.app/latest?from=XAU&to=TRY')
    let goldTryPerGram = null

    if (goldRes.ok) {
      const goldData = await goldRes.json()
      if (goldData.rates?.TRY) {
        // XAU is per troy ounce = 31.1035 grams
        goldTryPerGram = (goldData.rates.TRY / 31.1035).toFixed(2)
      }
    }

    // Fallback: calculate from USD/TRY if gold API fails
    if (!goldTryPerGram && usdTry) {
      // Approximate gold price ~3300 USD/oz
      goldTryPerGram = (3300 / 31.1035 * parseFloat(usdTry)).toFixed(2)
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(200).json({
      success: true,
      updatedAt: new Date().toISOString(),
      rates: { usdTry, eurTry, goldTryPerGram },
      goldSource: goldTryPerGram ? 'calculated' : 'fallback'
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
