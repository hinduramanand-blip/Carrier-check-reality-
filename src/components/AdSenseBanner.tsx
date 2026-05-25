import React, { useEffect, useRef } from 'react';

export default function AdSenseBanner({ adSenseId }: { adSenseId: string }) {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    if (adSenseId && typeof window !== 'undefined' && !adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        adRef.current = true;
      } catch (e) {
        console.error("AdSense Error: ", e);
      }
    }
  }, [adSenseId]);

  if (!adSenseId) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 px-6 flex justify-center overflow-hidden">
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', maxWidth: '728px', height: '90px' }}
           data-ad-client={adSenseId}
           data-ad-slot="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
