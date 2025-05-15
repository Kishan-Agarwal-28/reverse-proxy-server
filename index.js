import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import mime from 'mime-types'
import { URL } from 'url'


function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Proxy',
      },
    }

    const request = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest

    const proxyReq = request(requestOptions, (proxyRes) => {
      const contentType = mime.lookup(url) || 'application/octet-stream'
      let data = []

      proxyRes.on('data', (chunk) => {
        data.push(chunk)
      })

      proxyRes.on('end', () => {
        const buffer = Buffer.concat(data)
        resolve({
          data: buffer,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        })
      })
    })

    proxyReq.on('error', (err) => {
      console.error('Request error:', err)
      reject(err)
    })

    proxyReq.end()
  })
}


export default async function(req, res) {
  try {
    const url = new URL(req.url)
    const hostname = url.hostname || req.headers['host']
    const subdomain = hostname.split('.')[0]

    const path = url.pathname === '/' ? '/index.html' : url.pathname
    const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subdomain}${path}`

    const response = await makeRequest(fileUrl)
    
    return res.send(response.data, 200, response.headers)
  } catch (err) {
    console.error('Error in proxy handler:', err)
    return res.send('Internal Server Error', 500)
  }
}
