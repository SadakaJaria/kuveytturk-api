const GIST_DESCRIPTION = 'Kuveyt Türk Funds - My Portfolio'
const GIST_FILENAME = 'kt-portfolio.json'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'No token' })
    return
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  try {
    if (req.method === 'GET') {
      // Find existing portfolio gist
      const gistsRes = await fetch('https://api.github.com/gists', { headers })
      const gists = await gistsRes.json()
      const portfolioGist = gists.find(g => g.description === GIST_DESCRIPTION)

      if (!portfolioGist) {
        res.status(200).json({ positions: [] })
        return
      }

      // Get gist content
      const gistRes = await fetch(`https://api.github.com/gists/${portfolioGist.id}`, { headers })
      const gist = await gistRes.json()
      const content = gist.files[GIST_FILENAME]?.content || '{"positions":[]}'
      res.status(200).json(JSON.parse(content))

    } else if (req.method === 'POST') {
      const body = req.body
      const content = JSON.stringify(body)

      // Check if gist exists
      const gistsRes = await fetch('https://api.github.com/gists', { headers })
      const gists = await gistsRes.json()
      const portfolioGist = gists.find(g => g.description === GIST_DESCRIPTION)

      if (portfolioGist) {
        // Update existing gist
        await fetch(`https://api.github.com/gists/${portfolioGist.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            files: { [GIST_FILENAME]: { content } }
          })
        })
      } else {
        // Create new gist
        await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            description: GIST_DESCRIPTION,
            public: false,
            files: { [GIST_FILENAME]: { content } }
          })
        })
      }

      res.status(200).json({ success: true })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
