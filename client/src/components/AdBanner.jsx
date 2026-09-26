import { useEffect, useRef } from 'react';

const AdBanner = () => {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current) return;

    // Ad එක කලින් load වෙලා නැත්නම් විතරක් script එක එකතු කරන්න
    const containerId = "container-4c10f54fc39e0e91b896cb10b0ea89c5";
    
    // Container එක ඇතුළේ දැනටමත් script එක තියෙනවාද බලන්න
    if (!document.getElementById(containerId)) {
      const script = document.createElement('script');
      script.src = 'https://pl31523509.profitableratecpmnetwork.com/4c10f54fc39e0e91b896cb10b0ea89c5/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');

      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="my-6 flex justify-center items-center w-full min-h-[100px]">
      <div 
        id="container-4c10f54fc39e0e91b896cb10b0ea89c5" 
        ref={adRef} 
        className="w-full text-center"
      ></div>
    </div>
  );
};

export default AdBanner;