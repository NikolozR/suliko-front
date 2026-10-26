import Script from "next/script";
import {
  ANALYTICS_ALLOWED_HOSTS,
  getOfficePixelId,
  isProductionDeployment,
} from "@/shared/utils/analyticsEnv";

/**
 * Second Meta pixel for the Georgian Office landing page only.
 *
 * Follows the same two-half guard as the main pixel in the locale layout: the
 * server emits nothing outside a production deployment, and the snippet itself
 * bails on any host that is not a customer-facing one. It defines the fbq loader
 * only if the layout's snippet has not already done so, so the two can run in
 * either order, then initialises its own pixel and fires PageView for that pixel
 * alone via trackSingle.
 */
export default function OfficeMetaPixel() {
  if (!isProductionDeployment()) return null;

  const pixelId = getOfficePixelId();

  return (
    <>
      <Script
        id="meta-pixel-office"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){
  if(${JSON.stringify(ANALYTICS_ALLOWED_HOSTS)}.indexOf(window.location.hostname.toLowerCase())===-1)return;

  !function(f,b,e,v,n,t,s){
  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', ${JSON.stringify(pixelId)});
  fbq('trackSingle', ${JSON.stringify(pixelId)}, 'PageView');
})();`,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
