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

    // Get Gold price in USD per ounce from free API
    const goldRes = await fetch('https://api.metals.live/v1/spot/gold')
    const goldData = await goldRes.json()

    // Convert gold USD/oz to TRY/gram
    let goldTryPerGram = null
    if (goldData?.[0]?.price && usdTry) {
      const goldUsdPerOz = goldData[0].price
      const goldUsdPerGram = goldUsdPerOz / 31.1035
      goldTryPerGram = (goldUsdPerGram * parseFloat(usdTry)).toFixed(2)
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(200).json({
      success: true,
      updatedAt: new Date().toISOString(),
      rates: { usdTry, eurTry, goldTryPerGram }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
