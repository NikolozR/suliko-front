# CAPTCHA Integration Setup

This project now includes Google reCAPTCHA v2 integration for the newsletter subscription form.

## Setup Instructions

### 1. Get Google reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to create a new site
3. Choose reCAPTCHA v2 ("I'm not a robot" Checkbox)
4. Add your domain(s) to the domain list
5. Copy the **Site Key** and **Secret Key**

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LfipPcrAAAAAObN-vCn-mlQA9S4DDWRmBnmenDJ
RECAPTCHA_SECRET_KEY=6LfipPcrAAAAAEWx-6-PGiyNR1qkHGQA8vkg9usH
```

### 3. Features Implemented

- ✅ **CAPTCHA Component**: Reusable component with theme support
- ✅ **Newsletter Form**: Updated with CAPTCHA integration
- ✅ **API Endpoint**: `/api/newsletter` for server-side verification
- ✅ **Multilingual Support**: Updated translations for all languages
- ✅ **Theme Support**: Dark/light mode CAPTCHA themes
- ✅ **Error Handling**: Proper error states and user feedback

### 4. Files Modified/Created

#### New Files:
- `src/shared/components/Captcha.tsx` - CAPTCHA component
- `src/app/api/newsletter/route.ts` - Newsletter subscription API

#### Updated Files:
- `src/shared/components/TestimonialsSection.tsx` - Newsletter form with CAPTCHA
- `messages/en.json` - English translations
- `messages/ka.json` - Georgian translations  
- `messages/pl.json` - Polish translations

### 5. Usage

The CAPTCHA is automatically integrated into the newsletter subscription form in the TestimonialsSection. Users must complete the CAPTCHA before they can subscribe to the newsletter.

### 6. Testing

1. Set up your environment variables
2. Start the development server: `npm run dev`
3. Navigate to the testimonials section
4. Try subscribing to the newsletter with and without completing the CAPTCHA

### 7. Production Considerations

- Ensure your production domain is added to the reCAPTCHA site configuration
- Monitor reCAPTCHA analytics in the Google Admin Console
- Consider implementing rate limiting for the newsletter API endpoint
- Add proper logging for subscription attempts
