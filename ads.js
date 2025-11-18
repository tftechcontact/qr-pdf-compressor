// Load AdMob script
var script = document.createElement('script');
script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
script.async = true;
document.head.appendChild(script);

// Initialize top banner
var topAd = document.createElement('ins');
topAd.className = 'adsbygoogle';
topAd.style.display = 'block';
topAd.setAttribute('data-ad-client', 'ca-pub-YOUR_CLIENT_ID');
topAd.setAttribute('data-ad-slot', 'YOUR_AD_UNIT_ID_TOP');
document.body.insertBefore(topAd, document.body.firstChild);

// Initialize bottom banner
var bottomAd = document.createElement('ins');
bottomAd.className = 'adsbygoogle';
bottomAd.style.display = 'block';
bottomAd.setAttribute('data-ad-client', 'ca-pub-YOUR_CLIENT_ID');
bottomAd.setAttribute('data-ad-slot', 'YOUR_AD_UNIT_ID_BOTTOM');
document.body.appendChild(bottomAd);

// Activate ads
(adsbygoogle = window.adsbygoogle || []).push({});
(adsbygoogle = window.adsbygoogle || []).push({});
