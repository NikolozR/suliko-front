import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { NOTARY_WHATSAPP } from '@/shared/constants/notary';

const INBOX = 'info@th.com.ge';
const FROM = 'Suliko <noreply@th.com.ge>';

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[notary-upload] RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || 'N/A';
    const sourceLanguage = (formData.get('source_language') as string) || '-';
    const targetLanguage = (formData.get('target_language') as string) || '-';
    const notarialCertification = (formData.get('notarial_certification') as string) || 'No';
    const fileEntries = formData.getAll('files') as File[];

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 });
    }
    if (fileEntries.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const attachments = await Promise.all(
      fileEntries.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const fileList = fileEntries.map((f) => f.name).join(', ');

    // 1. Forward to inbox with all details + attachments
    const inboxResult = await resend.emails.send({
      from: FROM,
      to: INBOX,
      replyTo: email,
      subject: `[Suliko] New Notary Submission from ${name}`,
      html: `
        <h2>New Notary File Submission</h2>
        <h3>www.suliko.ge</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Source Language:</strong> ${sourceLanguage}</p>
        <p><strong>Target Language:</strong> ${targetLanguage}</p>
        <p><strong>Notarial Certification:</strong> ${notarialCertification}</p>
        <p><strong>Files:</strong> ${fileList}</p>
      `,
      attachments,
    });

    if (inboxResult.error) {
      console.error('[notary-upload] inbox email error:', inboxResult.error);
      return NextResponse.json({ error: inboxResult.error.message }, { status: 500 });
    }

    // 2. Send confirmation to user
    const confirmResult = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'თქვენი დოკუმენტები წარმატებით გამოიგზავნა! / Your Documents Have Been Successfully Received!',
      html: confirmationTemplate({ name, email, phone, fileList, sourceLanguage, targetLanguage, notarialCertification }),
    });

    if (confirmResult.error) {
      console.error('[notary-upload] confirmation email error:', confirmResult.error);
      // Inbox succeeded — don't fail the whole request
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[notary-upload] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function confirmationTemplate({
  name, email, phone, fileList, sourceLanguage, targetLanguage, notarialCertification,
}: {
  name: string; email: string; phone: string; fileList: string;
  sourceLanguage: string; targetLanguage: string; notarialCertification: string;
}) {
  void name; void email; void phone; void fileList; void sourceLanguage; void targetLanguage; void notarialCertification;
  return `<!DOCTYPE html>
<html lang="ka">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:32px 40px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Translation House · თარგმნის სახლი</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px">Professional Translation &amp; Notary Services | პროფესიონალური თარგმნა და სანოტარო მომსახურება</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px">თქვენი დოკუმენტები წარმატებით გამოიგზავნა!</h2>
            <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">გამარჯობა,</p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
              მადლობას გიხდით ჩვენი ვებ-გვერდით სარგებლობისთვის. გიდასტურებთ, რომ თქვენი ფაილები მიღებულია.
            </p>
            <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
              ზუსტი საფასურისა და ვადების დასადგენად, გთხოვთ, მოგვწეროთ შემდეგი დეტალები:
            </p>
            <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
              <li><strong>ენობრივი წყვილი</strong> – რომელი ენიდან რომელ ენაზე გსურთ თარგმნა?</li>
              <li><strong>თარგმანის ტიპი</strong> – გესაჭიროებათ სტანდარტული თარგმანი თუ სანოტარო დამოწმებით?</li>
              <li><strong>დამატებითი მოთხოვნები</strong> – გაქვთ თუ არა კონკრეტული დედლაინი (ბოლო ვადა) ან სხვა სპეციალური პირობა?</li>
            </ul>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
              როგორც კი მოგვაწვდით ამ ინფორმაციას, ჩვენი გუნდი მალევე დაგიბრუნდებათ ოფიციალური საფასო შეთავაზებითა და შესრულების ზუსტი დროით.
            </p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6">
              კითხვების შემთხვევაში, შეგიძლიათ პირდაპირ უპასუხოთ ამ მეილს.
            </p>

            <hr style="border:none;border-top:2px solid #e5e7eb;margin:0 0 32px" />
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-align:center">🇬🇧 For English, please scroll down</p>
            <hr style="border:none;border-top:2px solid #e5e7eb;margin:0 0 32px" />

            <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Your Documents Have Been Successfully Received!</h2>
            <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">Hello,</p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
              Thank you for submitting your documents through our website. We are pleased to confirm that we have successfully received them.
            </p>
            <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
              In order to provide you with a formal quote and timeline, please reply to this email with the following details:
            </p>
            <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
              <li><strong>Language pair</strong> – Please specify the source language and the target language.</li>
              <li><strong>Type of translation</strong> – Do you require a standard translation or a notarized (certified) translation?</li>
              <li><strong>Additional requirements</strong> – Do you have a specific deadline, or any other special instructions for this order?</li>
            </ul>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
              Once we receive your response, we will review your documents and follow up shortly with a quote. If you have any questions in the meantime, feel free to contact us.
            </p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6">
              Best wishes | საუკეთესო სურვილებით,
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb">
            <p style="margin:0 0 4px;color:#374151;font-size:14px;font-weight:700;text-align:center">Translation House · თარგმნის სახლი</p>
            <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-align:center">Professional Translation &amp; Notary Services | პროფესიონალური თარგმნა და სანოტარო მომსახურება</p>
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-align:center">📱 WhatsApp: <a href="https://wa.me/${NOTARY_WHATSAPP}" style="color:#1d4ed8;text-decoration:none">+995 591 729 911</a></p>
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-align:center">✉️ <a href="mailto:info@th.com.ge" style="color:#1d4ed8;text-decoration:none">info@th.com.ge</a></p>
            <p style="margin:0 0 4px;color:#6b7280;font-size:13px;text-align:center">🌐 <a href="https://notarytranslation.ge" style="color:#1d4ed8;text-decoration:none">notarytranslation.ge</a></p>
            <p style="margin:0;color:#6b7280;font-size:13px;text-align:center">📍 Tbilisi, Karvasla, Tsotne Dadiani St. 7, A316</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
