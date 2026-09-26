import { useEffect, useRef } from 'react';

const AdBanner = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const script = document.createElement('script');
      script.src = 'https://pl31523509.profitableratecpmnetwork.com/4c10f54fc39e0e91b896cb10b0ea89c5/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');

      const container = document.createElement('div');
      container.id = 'container-4c10f54fc39e0e91b896cb10b0ea89c5';

      bannerRef.current.appendChild(script);
      bannerRef.current.appendChild(container);
    }
  }, []);

  return (
    <div className="flex justify-center my-6 min-h-[100px] w-full">
      <div ref={bannerRef} />
    </div>
  );
};

export default AdBanner;