import express from 'express'
import { request as httpRequest } from 'http'
import { request as httpsRequest} from 'https'
import mime from 'mime-types'
import { URL } from 'url'
// import { dbConnect } from './db/dbConnect.js'

// dbConnect();
const app = express()


function makeRequest(url, res) {
  const parsedUrl = new URL(url)
  const requestOptions = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js Proxy',
    },
  }
console.log(parsedUrl)
  const request = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest
console.log(request)
  const proxyReq = request(requestOptions, (proxyRes) => {
   
    const contentType = mime.lookup(url) || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)

   
    res.removeHeader('content-security-policy')

    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('X-Content-Type-Options', 'nosniff')


    proxyRes.pipe(res)
  })
console.log(proxyReq)
  proxyReq.on('error', (err) => {
    console.error('Request error:', err)
    res.status(500).send('Internal Server Error')
  })

  proxyReq.end()
}


app.use('/', (req, res) => {
  try {
    console.log(req)
    console.log(req.headers)
   const hostname = req.headers.host|| req.hostname
    const subdomain = hostname.split('.')[0] 
console.log(subdomain)
console.log(hostname)

    const filePath = req.path === '/' ? '/index.html' : req.path

    const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subdomain}${filePath}`
console.log(fileUrl)
console.log(filePath)
    makeRequest(fileUrl, res)
  } catch (err) {
    console.error('Error in proxy handler:', err)
    res.status(500).send('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Reverse proxy server running on http://localhost:${PORT}`)
})
