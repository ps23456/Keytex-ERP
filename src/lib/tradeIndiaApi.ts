// TradeIndia API Configuration and Service
export interface TradeIndiaApiConfig {
  userid: string
  profile_id: string
  key: string
  apiUrl: string
  useProxy?: boolean // Option to use proxy instead of direct call
}

export interface TradeIndiaInquiry {
  // Add fields based on TradeIndia API response structure
  // Common fields might include:
  inquiry_id?: string
  inquiry_date?: string
  company_name?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  product_name?: string
  product_description?: string
  quantity?: string
  message?: string
  [key: string]: any // Allow for flexible API response
}

export interface FetchLeadsParams {
  from_date: string // Format: YYYY-MM-DD
  to_date: string   // Format: YYYY-MM-DD
  limit?: number
}

// Default API configuration
const DEFAULT_CONFIG: TradeIndiaApiConfig = {
  userid: '15810866',
  profile_id: '33942913',
  key: 'aad9ee3e956c28b13c17aa76dc2a3628',
  apiUrl: 'https://www.tradeindia.com/utils/my_inquiry.html'
}

// Get configuration from localStorage or use default
export const getTradeIndiaConfig = (): TradeIndiaApiConfig => {
  const stored = localStorage.getItem('tradeindia_api_config')
  if (stored) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
    } catch (e) {
      console.error('Error parsing TradeIndia config:', e)
    }
  }
  return DEFAULT_CONFIG
}

// Save configuration to localStorage
export const saveTradeIndiaConfig = (config: Partial<TradeIndiaApiConfig>): void => {
  const current = getTradeIndiaConfig()
  const updated = { ...current, ...config }
  localStorage.setItem('tradeindia_api_config', JSON.stringify(updated))
}

// Test API connection and get raw response (for debugging)
export const testTradeIndiaConnection = async (params: FetchLeadsParams): Promise<{ rawResponse: string; parsed: any; url: string }> => {
  const config = getTradeIndiaConfig()
  
  const convertDateFormat = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateStr
  }
  
  const fromDateFormatted = convertDateFormat(params.from_date)
  const toDateFormatted = convertDateFormat(params.to_date)
  
  const queryParams = new URLSearchParams({
    userid: config.userid,
    profile_id: config.profile_id,
    key: config.key,
    from_date: fromDateFormatted,
    to_date: toDateFormatted,
    ...(params.limit && { limit: params.limit.toString() })
  })

  const isDevelopment = import.meta.env.DEV
  const useProxy = config.useProxy !== false && isDevelopment
  const apiPath = config.apiUrl.replace('https://www.tradeindia.com', '')
  const url = useProxy 
    ? `/tradeindia-api${apiPath}?${queryParams.toString()}`
    : `${config.apiUrl}?${queryParams.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/html, */*',
    },
    mode: 'cors',
    credentials: 'omit'
  })

  const rawText = await response.text()
  let parsed: any = null
  
  try {
    parsed = JSON.parse(rawText)
  } catch (e) {
    // Not JSON, keep as null
  }

  return {
    rawResponse: rawText,
    parsed: parsed,
    url: url
  }
}

// Fetch leads from TradeIndia API
export const fetchTradeIndiaLeads = async (params: FetchLeadsParams): Promise<TradeIndiaInquiry[]> => {
  const config = getTradeIndiaConfig()
  
    // Build query parameters
    // TradeIndia API might expect date in DD-MM-YYYY format instead of YYYY-MM-DD
    // Try converting date format
    const convertDateFormat = (dateStr: string) => {
      // If date is in YYYY-MM-DD format, convert to DD-MM-YYYY
      const parts = dateStr.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}` // DD-MM-YYYY
      }
      return dateStr // Already in correct format or different format
    }
    
    const fromDateFormatted = convertDateFormat(params.from_date)
    const toDateFormatted = convertDateFormat(params.to_date)
    
    // Try both formats - TradeIndia might accept either
    const queryParams = new URLSearchParams({
      userid: config.userid,
      profile_id: config.profile_id,
      key: config.key,
      from_date: fromDateFormatted, // Try DD-MM-YYYY format first
      to_date: toDateFormatted,
      ...(params.limit && { limit: params.limit.toString() })
    })
    
    console.log('TradeIndia API Request Parameters:', {
      userid: config.userid,
      profile_id: config.profile_id,
      from_date_original: params.from_date,
      to_date_original: params.to_date,
      from_date_formatted: fromDateFormatted,
      to_date_formatted: toDateFormatted,
      limit: params.limit,
      queryString: queryParams.toString()
    })

    try {
    // Use proxy in development, direct URL in production (if CORS allows)
    const isDevelopment = import.meta.env.DEV
    const useProxy = config.useProxy !== false && isDevelopment // Use proxy by default in dev
    let url: string
    
    console.log('TradeIndia API Config:', {
      apiUrl: config.apiUrl,
      isDevelopment,
      useProxy,
      params: params
    })
    
    if (useProxy) {
      // Use Vite proxy to avoid CORS issues during development
      // Extract just the path from the API URL and use proxy prefix
      const apiPath = config.apiUrl.replace('https://www.tradeindia.com', '')
      // Proxy will rewrite /tradeindia-api to the root of tradeindia.com
      url = `/tradeindia-api${apiPath}?${queryParams.toString()}`
      console.log('Using proxy - Final URL:', url)
      console.log('Expected proxied URL to TradeIndia:', `https://www.tradeindia.com${apiPath}?${queryParams.toString()}`)
    } else {
      // In production or if proxy disabled, try direct URL (may fail due to CORS)
      url = `${config.apiUrl}?${queryParams.toString()}`
      console.log('Using direct URL:', url)
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/html, */*',
      },
      mode: isDevelopment ? 'cors' : 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('TradeIndia API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        responsePreview: errorText.substring(0, 500)
      })
      throw new Error(`TradeIndia API error: ${response.status} ${response.statusText}. URL: ${url}`)
    }

    // Try to parse as JSON, fallback to HTML/text parsing if needed
    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()
    
    console.log('TradeIndia API Response:', {
      status: response.status,
      contentType: contentType,
      responseLength: text.length,
      responsePreview: text.substring(0, 1000) // First 1000 chars
    })
    
    // Check for maintenance message
    if (text.toLowerCase().includes('maintenance') || text.toLowerCase().includes('undergoing maintenance')) {
      throw new Error('TradeIndia API is currently undergoing maintenance. Please try again later.')
    }
    
    // Check for error messages in response
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('sorry')) {
      const errorMatch = text.match(/(Sorry[^.!]+[.!])/i)
      if (errorMatch) {
        throw new Error(`TradeIndia API: ${errorMatch[1]}`)
      }
    }
    
    let data: any

    // Try to parse as JSON first
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.warn('Failed to parse JSON response:', e)
      }
    }
    
    // If not JSON or parsing failed, try to extract JSON from HTML
    if (!data) {
      // Look for JSON in script tags or embedded data
      const jsonMatches = [
        text.match(/<script[^>]*type=["']application\/json["'][^>]*>(.*?)<\/script>/s),
        text.match(/var\s+data\s*=\s*({[\s\S]*?});/),
        text.match(/data\s*[:=]\s*({[\s\S]*?});/),
        text.match(/({[\s\S]*?})/), // Last resort: try to find any JSON object
      ].filter(Boolean)
      
      for (const match of jsonMatches) {
        if (match && match[1]) {
          try {
            data = JSON.parse(match[1])
            break
          } catch (e) {
            // Continue to next match
          }
        }
      }
      
      // If still no data, try parsing the whole text as JSON
      if (!data) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          // If it's truly HTML, we need to parse it differently
          console.warn('TradeIndia API returned HTML. May need different parsing strategy.')
          console.warn('Full response:', text.substring(0, 1000))
          throw new Error('TradeIndia API returned HTML instead of JSON. The API endpoint may need to be configured differently or the response format has changed. Please check the API Settings.')
        }
      }
    }

    // Log the full response for debugging
    console.log('TradeIndia API Response Structure:', {
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : 'not an object',
      dataType: typeof data,
      dataPreview: data && typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : String(data).substring(0, 200)
    })

    // Handle different response structures
    if (Array.isArray(data)) {
      console.log(`Found ${data.length} leads in array response`)
      return data
    } else if (data && typeof data === 'object') {
      // Try common response wrapper keys
      const possibleKeys = ['data', 'inquiries', 'results', 'response', 'items', 'leads', 'records', 'list']
      for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
          console.log(`Found ${data[key].length} leads in '${key}' field`)
          return data[key]
        }
      }
      
      // Check if the object itself represents a single lead
      if (data.inquiry_id || data.company_name || data.contact_person) {
        console.log('Single lead object found, wrapping in array')
        return [data]
      }
      
      // Log all available keys for debugging
      console.warn('Unexpected TradeIndia API response structure. Available keys:', Object.keys(data))
      console.warn('Full response:', JSON.stringify(data, null, 2))
      
      // Return empty array if structure is unexpected
      return []
    } else {
      console.warn('Response is not an array or object:', typeof data, data)
      return []
    }
  } catch (error) {
    console.error('Error fetching TradeIndia leads:', error)
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to TradeIndia API. This might be due to CORS restrictions. Please check your API endpoint or use a proxy server.')
    }
    
    if (error instanceof Error) {
      // Check for CORS errors
      if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        throw new Error('CORS Error: TradeIndia API may block requests from browsers. You may need to use a proxy server or contact TradeIndia for API access.')
      }
      throw error
    }
    
    throw new Error('Unknown error occurred while fetching leads from TradeIndia API.')
  }
}

// Transform TradeIndia inquiry to our inquiry format
export const transformTradeIndiaToInquiry = (tradeIndiaInquiry: TradeIndiaInquiry, index: number = 0): any => {
  return {
    companyName: tradeIndiaInquiry.company_name || tradeIndiaInquiry.company || '',
    contactPerson: tradeIndiaInquiry.contact_person || tradeIndiaInquiry.contact_name || '',
    contactNumber: tradeIndiaInquiry.phone || tradeIndiaInquiry.mobile || tradeIndiaInquiry.telephone || '',
    email: tradeIndiaInquiry.email || '',
    address: tradeIndiaInquiry.address || tradeIndiaInquiry.location || '',
    source: 'tradeindia',
    status: 'new',
    priority: 'low',
    followUps: 0,
    products: [{
      itemName: tradeIndiaInquiry.product_name || tradeIndiaInquiry.product || 'Product from TradeIndia',
      quantity: tradeIndiaInquiry.quantity || '1',
      material: tradeIndiaInquiry.material || tradeIndiaInquiry.product_description || '',
      deliveryTime: '',
      designFileName: '',
      designFileData: '',
      additionalDetails: tradeIndiaInquiry.message || tradeIndiaInquiry.description || tradeIndiaInquiry.remarks || ''
    }],
    createdAt: tradeIndiaInquiry.inquiry_date || new Date().toISOString(),
    tradeIndiaInquiryId: tradeIndiaInquiry.inquiry_id || `ti_${Date.now()}_${index}`,
    originalTradeIndiaData: tradeIndiaInquiry // Keep original data for reference
  }
}

// Fetch and transform leads in one function
export const importTradeIndiaLeads = async (params: FetchLeadsParams): Promise<any[]> => {
  const leads = await fetchTradeIndiaLeads(params)
  return leads.map((lead, index) => transformTradeIndiaToInquiry(lead, index))
}

