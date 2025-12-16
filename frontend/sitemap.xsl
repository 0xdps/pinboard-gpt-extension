<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN" doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Pinboard GPT - XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: #1a1a1a;
            background: #f8fafc;
            margin: 0;
            padding: 0;
          }
          
          .header {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          
          .header h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
          }
          
          .header p {
            margin: 0.5rem 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          .info-box {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            border-left: 4px solid #3b82f6;
          }
          
          .info-box h2 {
            margin: 0 0 1rem;
            color: #1a1a1a;
            font-size: 1.3rem;
          }
          
          .info-box p {
            margin: 0.5rem 0;
            line-height: 1.6;
            color: #64748b;
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
          }
          
          .stat-box {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #3b82f6;
            display: block;
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: #64748b;
            margin-top: 0.5rem;
          }
          
          .sitemap-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th {
            background: #f1f5f9;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e2e8f0;
          }
          
          td {
            padding: 1rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          
          tr:hover {
            background: #f8fafc;
          }
          
          .url-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            word-break: break-all;
          }
          
          .url-link:hover {
            color: #2563eb;
            text-decoration: underline;
          }
          
          .priority {
            font-weight: 600;
          }
          
          .priority-high { color: #059669; }
          .priority-medium { color: #d97706; }
          .priority-low { color: #dc2626; }
          
          .changefreq {
            background: #f1f5f9;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            color: #475569;
          }
          
          .lastmod {
            color: #64748b;
            font-size: 0.9rem;
          }
          
          .footer {
            background: #1e293b;
            color: white;
            padding: 2rem;
            margin-top: 3rem;
            text-align: center;
          }
          
          .footer a {
            color: #60a5fa;
            text-decoration: none;
          }
          
          .footer a:hover {
            color: #93c5fd;
          }
          
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }
            
            .header {
              padding: 1.5rem;
            }
            
            .header h1 {
              font-size: 1.5rem;
            }
            
            .stats {
              grid-template-columns: repeat(2, 1fr);
            }
            
            th, td {
              padding: 0.75rem 0.5rem;
            }
            
            .url-link {
              font-size: 0.85rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📌 Pinboard GPT - XML Sitemap</h1>
          <p>Pin the Messages That Matter - Website Structure</p>
        </div>
        
        <div class="container">
          <div class="info-box">
            <h2>About This Sitemap</h2>
            <p>This XML sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs for the Pinboard GPT website and related documentation.</p>
            <p>It helps search engines discover and index our content more efficiently, improving our visibility in search results.</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <span class="stat-number"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat-box">
              <span class="stat-number"><xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:priority >= 0.8])"/></span>
              <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-box">
              <span class="stat-number"><xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:changefreq = 'weekly'])"/></span>
              <div class="stat-label">Weekly Updates</div>
            </div>
            <div class="stat-box">
              <span class="stat-number">2025-11-01</span>
              <div class="stat-label">Last Generated</div>
            </div>
          </div>
          
          <div class="sitemap-table">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Priority</th>
                  <th>Change Frequency</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <xsl:sort select="sitemap:priority" order="descending"/>
                  <tr>
                    <td>
                      <a href="{sitemap:loc}" class="url-link" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <span class="priority">
                        <xsl:attribute name="class">
                          priority
                          <xsl:choose>
                            <xsl:when test="sitemap:priority >= 0.8"> priority-high</xsl:when>
                            <xsl:when test="sitemap:priority >= 0.5"> priority-medium</xsl:when>
                            <xsl:otherwise> priority-low</xsl:otherwise>
                          </xsl:choose>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                    <td>
                      <span class="changefreq">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </span>
                    </td>
                    <td class="lastmod">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <p>
            Generated for <a href="https://pinboardgpt.app">Pinboard GPT</a> | 
            <a href="https://github.com/0xdps/gpt-pinboard-extension">GitHub Repository</a> | 
            Made with ❤️ by <a href="https://github.com/0xdps">Devendra Pratap Singh</a>
          </p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>