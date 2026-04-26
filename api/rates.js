module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://sadakajaria.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Get USD/TRY and EUR/TRY rates
    const ratesRes = await fetch(
      'https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,XAU'
    )
    const ratesData = await ratesRes.json()

    // USD/TRY = 1 / (TRY to USD rate)
    const usdTry = ratesData.rates?.USD ? (1 / ratesData.rates.USD).toFixed(2) : null
    const eurTry = ratesData.rates?.EUR ? (1 / ratesData.rates.EUR).toFixed(2) : null

    // Gold price in TRY per gram (XAU is per troy ounce = 31.1035 grams)
    const xauTry = ratesData.rates?.XAU
      ? ((1 / ratesData.rates.XAU) / 31.1035).toFixed(2)
      : null

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(200).json({
      success: true,
      updatedAt: new Date().toISOString(),
      rates: {
        usdTry,
        eurTry,
        goldTryPerGram: xauTry,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
