// Fallback for Vercel deployment
module.exports = () => {
  return {
    statusCode: 302,
    headers: {
      Location: '/'
    }
  }
}