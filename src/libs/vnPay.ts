import config from '@/configs/config'
import moment from 'moment'
import querystring from 'querystring'
import crypto from 'crypto'

// Enum for Bank Codes
enum BankCode {
  VNPAYQR = 'VNPAYQR',
  VNBANK = 'VNBANK',
  INTCARD = 'INTCARD'
}

// Interface for VNPay Parameters
interface VNPayParams {
  [key: string]: string | number
}

// Locale type
type Locale = 'vn' | 'en'

// Function to sort object keys
function sortObject(obj: VNPayParams): VNPayParams {
  const sorted: VNPayParams = {}
  const str: string[] = []

  // Collect and sort keys
  Object.keys(obj).forEach((key) => {
    str.push(encodeURIComponent(key))
  })
  str.sort()

  // Rebuild object with sorted keys
  str.forEach((key) => {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+')
  })

  return sorted
}

// Create Payment URL function
const createPaymentUrl = (orderId: string, amount: number, bankCode: BankCode | null = null, locale: Locale = 'vn', ipAddr: string = '127.0.0.1'): string => {
  // Set timezone
  process.env.TZ = 'Asia/Ho_Chi_Minh'

  // Get current date
  const date = new Date()
  const createDate = moment(date).format('YYYYMMDDHHmmss')

  // Retrieve configuration
  const tmnCode = config.vnPay.tmnCode
  const secretKey = config.vnPay.hashSecret
  const vnpUrl = config.vnPay.url
  const returnUrl = config.vnPay.returnUrl

  // Prepare VNPay parameters
  const vnp_Params: VNPayParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan cho ma GD:${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  }

  // Add bank code if provided
  if (bankCode) {
    vnp_Params['vnp_BankCode'] = bankCode
  }

  // Sort parameters
  const sortedParams = sortObject(vnp_Params)

  // Generate secure hash
  const signData = querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: encodeURIComponent })
  const hmac = crypto.createHmac('sha512', secretKey)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  // Add secure hash to parameters
  sortedParams['vnp_SecureHash'] = signed

  // Build final URL
  const finalUrl = `${vnpUrl}?${querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: encodeURIComponent })}`

  return finalUrl
}

// Export as module
export default {
  createPaymentUrl,
  BankCode
}
