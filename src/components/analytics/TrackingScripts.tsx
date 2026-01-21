import { prisma } from '@/lib/db/prisma';
import Script from 'next/script';

interface TrackingSettings {
  googleVerificationCode?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  googleAdsId?: string;
  facebookPixelId?: string;
  facebookVerificationCode?: string;
  bingVerificationCode?: string;
  microsoftClarityId?: string;
  hotjarId?: string;
  customHeadScripts?: string;
  customBodyScripts?: string;
}

async function getTrackingSettings(): Promise<TrackingSettings> {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            'googleVerificationCode',
            'googleAnalyticsId',
            'googleTagManagerId',
            'googleAdsId',
            'facebookPixelId',
            'facebookVerificationCode',
            'bingVerificationCode',
            'microsoftClarityId',
            'hotjarId',
            'customHeadScripts',
            'customBodyScripts',
          ],
        },
      },
    });

    const settingsMap: TrackingSettings = {};
    settings.forEach((s) => {
      (settingsMap as any)[s.key] = s.value;
    });

    return settingsMap;
  } catch (error) {
    // Silently fail during build time
    return {};
  }
}

export default async function TrackingScripts() {
  const settings = await getTrackingSettings();

  return (
    <>
      {/* Google Tag Manager - Head (should be as high as possible) */}
      {settings.googleTagManagerId && (
        <Script
          id="gtm-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
            `,
          }}
        />
      )}

      {/* Google Analytics 4 */}
      {settings.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}', {
                  page_path: window.location.pathname,
                  send_page_view: true
                });
              `,
            }}
          />
        </>
      )}

      {/* Google Ads Conversion Tracking */}
      {settings.googleAdsId && (
        <Script
          id="google-ads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              gtag('config', '${settings.googleAdsId}');
            `,
          }}
        />
      )}

      {/* Facebook Pixel */}
      {settings.facebookPixelId && (
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${settings.facebookPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Microsoft Clarity */}
      {settings.microsoftClarityId && (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${settings.microsoftClarityId}");
            `,
          }}
        />
      )}

      {/* Hotjar */}
      {settings.hotjarId && (
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${settings.hotjarId},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}

      {/* Custom Head Scripts */}
      {settings.customHeadScripts && (
        <Script
          id="custom-head-scripts"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: settings.customHeadScripts,
          }}
        />
      )}

      {/* Custom Body Scripts */}
      {settings.customBodyScripts && (
        <Script
          id="custom-body-scripts"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: settings.customBodyScripts,
          }}
        />
      )}
    </>
  );
}

// Export verification codes for metadata
export async function getVerificationCodes() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            'googleVerificationCode',
            'bingVerificationCode',
            'facebookVerificationCode',
          ],
        },
      },
    });

    const codes: Record<string, string> = {};
    settings.forEach((s) => {
      codes[s.key] = s.value;
    });

    return codes;
  } catch (error) {
    // Silently fail during build time
    return {};
  }
}

// GTM noscript for body (for users with JS disabled)
export function GTMNoScript({ gtmId }: { gtmId: string }) {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
