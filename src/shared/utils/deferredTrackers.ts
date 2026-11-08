import type { DeferredScript } from "@/shared/components/DeferredScripts";
import { ANALYTICS_ALLOWED_HOSTS } from "@/shared/utils/analyticsEnv";

const hostGuard = `if(${JSON.stringify(ANALYTICS_ALLOWED_HOSTS)}.indexOf(window.location.hostname.toLowerCase())===-1)return;`;

const metaPixel = (id: string) => `(function(){
  ${hostGuard}
  !function(f,b,e,v,n,t,s){
  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', ${JSON.stringify(id)});
  // trackSingle: the Office page registers a second pixel, and a plain track
  // would count this PageView on that one too depending on script order.
  fbq('trackSingle', ${JSON.stringify(id)}, 'PageView', {
    content_name: 'Suliko Landing Page',
    content_category: 'AI Translation Service'
  });
})();`;

const hotjar = `(function(h,o,t,j,a,r){
  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
  h._hjSettings={hjid:5128056,hjsv:6};
  a=o.getElementsByTagName('head')[0];
  r=o.createElement('script');r.async=1;
  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
  a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`;

const crisp = `window.$crisp=window.$crisp||[];
window.CRISP_WEBSITE_ID="b6b29d3c-ed85-4bf6-bfce-b95961ccf6dc";
window.CRISP_READY_TRIGGER=function(){
  if(window.innerWidth<768){
    setTimeout(function(){
      // The launcher is a fixed box near the bottom-right corner. Found once.
      var launcher=[];
      var all=document.querySelectorAll("*");
      for(var i=0;i<all.length;i++){
        var s=window.getComputedStyle(all[i]);
        if(s.position==="fixed"&&parseInt(s.bottom)<40&&parseInt(s.right)<40&&parseInt(s.zIndex)>1000){
          launcher.push(all[i]);
        }
      }
      // Inside the app (it has a bottom bar and a sticky Translate button) the
      // corner and the middle of the right edge both cover content: it sits in the
      // empty band at the top right. On the public pages it keeps Crisp's corner.
      // Asked again every second, so moving between the two follows.
      function place(){
        var app=!!document.querySelector("nav.fixed.bottom-0");
        for(var j=0;j<launcher.length;j++){
          var st=launcher[j].style;
          if(app){
            st.setProperty("bottom","auto","important");
            st.setProperty("top","0.5rem","important");
            st.setProperty("right","0.75rem","important");
          }else{
            st.removeProperty("top");
            st.removeProperty("bottom");
            st.removeProperty("right");
          }
          st.removeProperty("transform");
        }
      }
      place();
      setInterval(place,1000);
    },1000);
  }
};
(function(){
  var d=document,s=d.createElement("script");
  s.src="https://client.crisp.chat/l.js";
  s.async=1;
  d.getElementsByTagName("head")[0].appendChild(s);
})();`;

const yandex = (id: number) => `(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${id}', 'ym');
ym(${id}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`;

const brevoInit = `window.Brevo = window.Brevo || [];
Brevo.push(["init", { client_key: "k9gjme1efnz6rcx1wtl5w9oy" }]);`;

/** Every third-party script the site loads, in the order it used to load. */
export function getDeferredTrackers(metaPixelId: string | undefined): DeferredScript[] {
  return [
    ...(metaPixelId ? [{ id: "meta-pixel", code: metaPixel(metaPixelId) }] : []),
    { id: "hotjar", code: hotjar },
    { id: "crisp-chat", code: crisp },
    { id: "yandex-metrika", code: yandex(104728476) },
    { id: "yandex-metrika-2", code: yandex(105466504) },
    { id: "brevo", src: "https://cdn.brevo.com/js/sdk-loader.js", code: brevoInit },
  ];
}
