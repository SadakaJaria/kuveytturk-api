module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = 'https://kuveytturk-api.vercel.app/api/auth/callback'
  const scope = 'gist'
  
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  
  res.redirect(githubUrl)
}
