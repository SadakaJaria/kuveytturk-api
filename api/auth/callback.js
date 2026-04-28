module.exports = async (req, res) => {
  const { code } = req.query

  if (!code) {
    res.redirect('https://kuveytturk-funds.vercel.app/portfolio?error=no_code')
    return
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      })
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      res.redirect('https://kuveytturk-funds.vercel.app/portfolio?error=auth_failed')
      return
    }

    const token = tokenData.access_token
    res.redirect(`https://kuveytturk-funds.vercel.app/portfolio?token=${token}`)

  } catch (err) {
    res.redirect('https://kuveytturk-funds.vercel.app/portfolio?error=server_error')
  }
}
