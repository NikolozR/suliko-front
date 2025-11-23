# Paysera API Request Example

## Payment Creation Request

### Endpoint
```
POST https://wallet.paysera.com/rest/v1/payment
```

### Headers
```http
Content-Type: application/json;charset=utf-8
User-Agent: Suliko/1.0
Authorization: MAC id="your_client_id", ts="1704067200", nonce="random_unique_string", mac="calculated_mac_signature"
```

### Request Body
```json
{
  "items": [
    {
      "title": "Starter Package",
      "description": "75 pages per month translation package",
      "image_uri": "https://suliko.ge/images/starter-package.jpg",
      "price": 5700,
      "currency": "EUR",
      "quantity": 1
    }
  ],
  "redirect_uri": "https://suliko.ge/en/payment/success",
  "cancel_uri": "https://suliko.ge/en/payment/cancel",
  "callback_uri": "https://suliko.ge/api/payment/callback"
}
```

## Alternative: Using Paysera Payment Gateway (Form-based)

### Endpoint
```
POST https://www.paysera.com/pay
```

### Request Body (Form Data)
```
projectid=YOUR_PROJECT_ID
orderid=ORDER_12345
amount=5700
currency=EUR
country=LT
accepturl=https://suliko.ge/en/payment/success
cancelurl=https://suliko.ge/en/payment/cancel
callbackurl=https://suliko.ge/api/payment/callback
test=0
sign=calculated_signature
```

## Example with GEL (Georgian Lari)

### Request Body
```json
{
  "items": [
    {
      "title": "Starter Package",
      "description": "75 pages per month translation package",
      "image_uri": "https://suliko.ge/images/starter-package.jpg",
      "price": 5700,
      "currency": "GEL",
      "quantity": 1
    }
  ],
  "redirect_uri": "https://suliko.ge/ka/payment/success",
  "cancel_uri": "https://suliko.ge/ka/payment/cancel",
  "callback_uri": "https://suliko.ge/api/payment/callback"
}
```

## Response Example

### Success Response
```json
{
  "transaction_key": "abc123def456",
  "redirect_uri": "https://wallet.paysera.com/pay/abc123def456",
  "status": "pending"
}
```

### Error Response
```json
{
  "error": "invalid_request",
  "error_description": "Invalid payment amount",
  "status": "error"
}
```

## Notes

1. **Price Format**: Prices are in cents (e.g., 5700 = €57.00 or 57.00 GEL)
2. **MAC Authentication**: Requires calculating a MAC signature using your `mac_key` and `mac_algorithm`
3. **Currency**: Use "EUR" for Euro, "GEL" for Georgian Lari
4. **Callback URL**: Must be publicly accessible and handle POST requests
5. **Security**: Always use HTTPS for all API requests

## Integration with Current Codebase

Based on your current `paymentService.ts`, the backend endpoint `/Payment/create` should handle the Paysera API integration and return a `redirectUrl` that the frontend can use to redirect users to Paysera's payment page.

