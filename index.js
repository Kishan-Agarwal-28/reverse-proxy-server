import express from "express";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import mime, { contentType } from "mime-types";
import { URL } from "url";
import { dbConnect } from "./db/dbConnect.js";
import { connectRedis } from "./db/connectRedis.js";
dbConnect();
connectRedis();
import { getSubDomain } from "./util/queryDb.js";
import jwt from "jsonwebtoken";
const app = express();

function makeRequest(url, res, content = "application/octet-stream", errorHeaders = null) {
  const parsedUrl = new URL(url);
  
  console.log("Making request to:", url);
  console.log("Parsed URL - pathname:", parsedUrl.pathname);
  console.log("Parsed URL - search:", parsedUrl.search);
  
  const requestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: "GET",
    headers: {
      "User-Agent": "Node.js Proxy",
    },
  };

  const request = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;

  const proxyReq = request(requestOptions, (proxyRes) => {
    const contentType = mime.lookup(parsedUrl.pathname) || content;
    res.setHeader("Content-Type", contentType);
    res.removeHeader("content-security-policy");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Add custom error headers if provided
    if (errorHeaders) {
      res.setHeader("X-Status", errorHeaders.status);
      res.setHeader("X-Reason", errorHeaders.reason);
    }

    // If it's HTML and we have error headers to inject, collect the response and modify it
    if (content === "text/html" && errorHeaders) {
      let htmlContent = '';
      
      proxyRes.on('data', (chunk) => {
        htmlContent += chunk.toString();
      });
      
      proxyRes.on('end', () => {
        // Inject error information as a script tag
        const scriptInjection = `
          <script>
            window.errorInfo = {
              status: "${errorHeaders.status}",
              reason: "${errorHeaders.reason.replace(/"/g, '\\"')}"
            };
          </script>
        `;
        
        // Inject before closing head tag
        let injectedHtml = htmlContent.replace('</head>', `${scriptInjection}</head>`);
        
        // Fix Lottie animation paths - make them absolute
        const baseUri = process.env.BASE_URI || '';
        injectedHtml = injectedHtml.replace(
          /src="lottie\//g,
          `src="${baseUri}/subdomains/__error/lottie/`
        );
        
        res.send(injectedHtml);
      });
    } else {
      // For non-HTML files, just pipe the response
      proxyRes.pipe(res);
    }
  });
  
  proxyReq.on("error", (err) => {
    console.error("Request error:", err);
    res.status(500).send("Internal Server Error");
  });

  proxyReq.end();
}

app.use("/", async (req, res) => {
  try {
    console.log("Request received");
    const rawHost = req.headers.host || "";
    const subdomain = req.headers["x-subdomain"] || rawHost.split(".")[0];
    if (subdomain === "https://reverse-proxy-server-o4li") {
      return res.status(200).send("Reverse Proxy Server is running");
    } else {
      if (!subdomain) {
        return res.status(400).send("Subdomain not provided");
      }
      const restrictedSubdomains = [
        "www", "api", "admin", "blog", "dashboard", "support", "help", "contact", "about", "terms", "privacy", "legal", "status", "docs", "forum", "login", "register", "signin", "signup", "logout", "home", "index", "store", "shop", "cart", "assets", "static", "public", "images", "files", "media", "uploads", "temp", "resources", "http", "https", "localhost", "example", "demo", "test", "staging", "dev", "testbed", "preview", "internal", "secure", "cms", "panel", "adminpanel", "control", "auth", "oauth", "identity", "loginpage", "logoutpage", "error", "maintenance", "billing", "checkout", "payments", "order", "user", "profile", "account", "newsletter", "cartpage", "assets", "cdn", "download", "uploads", "resources", "server", "monitoring", "data", "platform", "api-v1", "api-v2", "api-v3", "api-beta", "adminapi", "authapi", "secureapi", "hooks", "ping", "verify", "robots", "sitemap", "notifications", "messaging", "uploads", "imageserver", "content", "mediafiles", "resources", "downloadfiles", "testing", "console", "cli", "toolbox", "tool", "scripts", "cloud", "supportcenter", "feedback", "tickets", "audit", "logs", "alert", "monitoring", "statuspage", "incident", "release", "updates", "live", "statuspage", "supportchat"
      ];
      
      if (restrictedSubdomains.includes(subdomain)) {
        console.log("Restricted subdomain access attempt:", subdomain);
        const errorHeaders = {
          status: "400",
          reason: "Restricted subdomain access attempt",
        };
        const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
        makeRequest(errorUrl, res, "text/html", errorHeaders);
        return;
      }
      
      const subAvailable = await getSubDomain(subdomain);

      if (!subAvailable) {
        console.log("Subdomain not found");
        const errorHeaders = {
          status: "404",
          reason: "Subdomain not found",
        };
        const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
        makeRequest(errorUrl, res, "text/html", errorHeaders);
        return;
      } else if (subAvailable.Ispublic) {
        const filePath = req.path === "/" ? "/index.html" : req.path;
        console.log("Public file path:", filePath);
        const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subAvailable.owner}/${subAvailable.projectID}${filePath}`;
        console.log("File URL:", fileUrl);
        makeRequest(fileUrl, res);
        return;
      } else {
        const { token } = req.query;
        if (!token) {
          const errorHeaders = {
            status: "401",
            reason: "Unauthorized Access You need a valid url token to access this site as it is private",
          };
          const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
          makeRequest(errorUrl, res, "text/html", errorHeaders);
          return;
        } else {
          try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!decodedToken || decodedToken.sub !== subdomain) {
              const errorHeaders = {
                status: "401",
                reason: "Unauthorized Access You need a valid url token to access this site as it is private",
              };
              const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
              makeRequest(errorUrl, res, "text/html", errorHeaders);
              return;
            } else {
              const filePath = req.path === "/" ? "/index.html" : req.path;
              const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subAvailable.owner}/${subAvailable.projectID}${filePath}`;
              console.log("File URL:", fileUrl);
              makeRequest(fileUrl, res);
              return;
            }
          } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            const errorHeaders = {
              status: "401",
              reason: "Invalid or expired token",
            };
            const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
            makeRequest(errorUrl, res, "text/html", errorHeaders);
            return;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in proxy handler:", err);
    const errorHeaders = {
      status: "500",
      reason: "Internal Server Error",
    };
    const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html`;
    makeRequest(errorUrl, res, "text/html", errorHeaders);
    return;
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Reverse proxy server running on http://localhost:${PORT}`);
});