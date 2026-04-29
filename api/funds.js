const fetch = require('node-fetch')
const cheerio = require('cheerio')

const FUND_META = {
  KLU: { category: 'tl', riskLevel: 1, managementFee: 1.3, stoppageRate: 17.5, buyingValue: 'T+0' },
  KSV: { category: 'tl', riskLevel: 1, managementFee: 1.2, stoppageRate: 17.5, buyingValue: 'T+0' },
  KTV: { category: 'tl', riskLevel: 1, managementFee: 1.1, stoppageRate: 17.5, buyingValue: 'T+0' },
  KTN: { category: 'tl', riskLevel: 1, managementFee: 1.2, stoppageRate: 17.5, buyingValue: 'T+0' },
  KTR: { category: 'tl', riskLevel: 1, managementFee: 1.3, stoppageRate: 17.5, buyingValue: 'T+0' },
  KDL: { category: 'fx', riskLevel: 6, managementFee: 1.5, stoppageRate: 0, buyingValue: 'T+1' },
  KTT: { category: 'fx', riskLevel: 6, managementFee: 1.6, stoppageRate: 0, buyingValue: 'T+1' },
  KPD: { category: 'fx', riskLevel: 6, managementFee: 1.5, stoppageRate: 0, buyingValue: 'T+1' },
  KAV: { category: 'fx', riskLevel: 6, managementFee: 1.5, stoppageRate: 0, buyingValue: 'T+1' },
  KCV: { category: 'multi', riskLevel: 2, managementFee: 1.8, stoppageRate: 17.5, buyingValue: 'T+1' },
  KTM: { category: 'multi', riskLevel: 3, managementFee: 1.7, stoppageRate: 17.5, buyingValue: 'T+1' },
  KPC: { category: 'domestic', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+2' },
  KPU: { category: 'domestic', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+2' },
  KPA: { category: 'domestic', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+2' },
  KTS: { category: 'domestic', riskLevel: 4, managementFee: 2.2, stoppageRate: 0, buyingValue: 'T+2' },
  KTJ: { category: 'foreign', riskLevel: 6, managementFee: 2.5, stoppageRate: 0, buyingValue: 'T+3' },
  KNJ: { category: 'foreign', riskLevel: 5, managementFee: 2.5, stoppageRate: 0, buyingValue: 'T+3' },
  KSR: { category: 'foreign', riskLevel: 5, managementFee: 2.5, stoppageRate: 0, buyingValue: 'T+3' },
  KME: { category: 'variable', riskLevel: 2, managementFee: 1.5, stoppageRate: 17.5, buyingValue: 'T+1' },
  KDE: { category: 'variable', riskLevel: 3, managementFee: 1.7, stoppageRate: 17.5, buyingValue: 'T+1' },
  KUD: { category: 'variable', riskLevel: 3, managementFee: 1.8, stoppageRate: 17.5, buyingValue: 'T+1' },
  KUA: { category: 'variable', riskLevel: 5, managementFee: 2.0, stoppageRate: 17.5, buyingValue: 'T+2' },
  KZL: { category: 'metals', riskLevel: 6, managementFee: 1.8, stoppageRate: 0, buyingValue: 'T+1' },
  KZU: { category: 'metals', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+1' },
  KUT: { category: 'metals', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+1' },
  KGM: { category: 'metals', riskLevel: 6, managementFee: 2.0, stoppageRate: 0, buyingValue: 'T+1' },
  KU3: { category: 'domestic', riskLevel: 5, managementFee: 2.2, stoppageRate: 0, buyingValue: 'T+1' },
  KIK: { category: 'foreign', riskLevel: 6, managementFee: 2.5, stoppageRate: 17.5, buyingValue: 'T+1' },
}

async function scrapePage(url, $funds) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
      },
      timeout: 15000,
    })
    if (!res.ok) return
    const html = await res.text()
    const $ = cheerio.load(html)

    $('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td')
        if (cells.length < 8) return
        const linkText = $(cells[0]).find('a').text().trim()
        const codeMatch = linkText.match(/^([A-ZİÇŞ0-9]{2,4})-/)
        if (!codeMatch) return
        const code = codeMatch[1]
        if ($funds[code]) return // already have data
        const price  = parseFloat($(cells[3]).text().trim().replace(',', '.')) || 0
        const ret1m  = parseFloat($(cells[4]).text().trim().replace('%','').replace(',', '.')) || 0
        const ret3m  = parseFloat($(cells[5]).text().trim().replace('%','').replace(',', '.')) || 0
        const ret6m  = parseFloat($(cells[6]).text().trim().replace('%','').replace(',', '.')) || 0
        const retYtd = parseFloat($(cells[7]).text().trim().replace('%','').replace(',', '.')) || 0
        const ret1y  = parseFloat($(cells[8]).text().trim().replace('%','').replace(',', '.')) || 0
        if (price > 0) {
          $funds[code] = { price, ret1m, ret3m, ret6m, retYtd, ret1y }
        }
      })
    })
  } catch (err) {
    console.error(`Error scraping ${url}:`, err.message)
  }
}

async function scrapeFundReturns() {
  const funds = {}
  await scrapePage('https://www.kuveytturkportfoy.com.tr/en/fund-returns/', funds)
  await scrapePage('https://www.kuveytturkportfoy.com.tr/fon-getirileri/', funds)
  return funds
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  try {
    const liveData = await scrapeFundReturns()
    const updatedAt = new Date().toISOString()
    const result = {}
    for (const [code, meta] of Object.entries(FUND_META)) {
      const live = liveData[code] || {}
      result[code] = {
        code,
        ...meta,
        price:         live.price   ?? null,
        monthlyReturn: live.ret1m   ?? null,
        return3m:      live.ret3m   ?? null,
        return6m:      live.ret6m   ?? null,
        ytd:           live.retYtd  ?? null,
        annualReturn:  live.ret1y   ?? null,
        updatedAt,
      }
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json({ success: true, updatedAt, funds: result })
  } catch (err) {
    console.error('Scrape error:', err.message)
    res.status(500).json({ success: false, error: err.message, funds: {} })
  }
}
