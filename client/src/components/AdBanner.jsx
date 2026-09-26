import React, { useEffect, useRef } from 'react';

const AdBanner = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      // atOptions global object එක සකස් කිරීම
      window.atOptions = {
        'key': '9165b790138ada8d4a0cdeac822d81ba',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };

      // script එක dynamic එකතු කිරීම
      const script = document.createElement('script');
      script.src = 'https://www.highrevenueformat.com/9165b790138ada8d4a0cdeac822d81ba/invoke.js';
      script.async = true;

      bannerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="flex justify-center my-6 min-h-[600px] w-[160px]">
      <div ref={bannerRef} />
    </div>
  );
};

export default AdBanner;