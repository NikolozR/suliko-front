export const NOTARY_PHONE = process.env.NEXT_PUBLIC_NOTARY_PHONE ?? '+995591729911'
export const NOTARY_WHATSAPP = NOTARY_PHONE.replace(/\D/g, '')
/** Display-friendly format, e.g. "+995 591 729 911" */
export const NOTARY_PHONE_DISPLAY = NOTARY_PHONE.replace(
  /^\+995(\d{3})(\d{3})(\d{3})$/,
  '+995 $1 $2 $3'
)
