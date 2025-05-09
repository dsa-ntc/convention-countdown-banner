import { apiInitializer } from "discourse/lib/api";
import { h } from "virtual-dom";
import { dasherize } from "@ember/string";

export default apiInitializer("0.11.1", (api) => {
  if (!api.container.lookup("service:site-settings").countdown_banner_enabled) {
    return;
  }

  const targetDateSetting = api.container.lookup("service:site-settings").countdown_target_date;
  const eventText = api.container.lookup("service:site-settings").countdown_event_text;
  const targetDate = new Date(targetDateSetting).getTime();

  let countdownInterval;

  function updateCountdownBanner(connector) {
    const existingBanner = connector.element.querySelector(".custom-countdown-banner");
    if (existingBanner) {
      existingBanner.remove();
    }

    const now = new Date().getTime();
    const distance = targetDate - now;

    let bannerContent;

    if (distance < 0) {
      // bannerContent = h("div.custom-countdown-banner-text", "The deadline has passed!");
      if (countdownInterval) clearInterval(countdownInterval);
      return null; 
    } else {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      bannerContent = h("div.custom-countdown-banner-text", [
        h("strong", `${days} days, ${hours} hours, ${minutes} minutes`),
        ` remaining ${eventText}`,
      ]);
    }

    return h("div.custom-countdown-banner", bannerContent);
  }

  api.decorateWidget("header:after", (helper) => {
    // could also try "above-main-container:before" 

    const siteSettings = helper.widget.container.lookup("service:site-settings");

    let bannerElement = updateCountdownBanner(helper.widget);

    const redrawBanner = () => {
      const newBannerElement = updateCountdownBanner(helper.widget);
      const oldBanner = helper.widget.element.querySelector(".custom-countdown-banner");

      if (newBannerElement) {
        if (oldBanner) {
          oldBanner.replaceWith(newBannerElement.render());
        } else {
          const headerElement = document.querySelector(".d-header"); 
          if (headerElement && headerElement.nextSibling) {
             headerElement.parentNode.insertBefore(newBannerElement.render(), headerElement.nextSibling);
          } else if (headerElement) {
             headerElement.parentNode.appendChild(newBannerElement.render());
          }
        }
      } else if (oldBanner) {
        oldBanner.remove(); 
      }
    };

    if (countdownInterval) clearInterval(countdownInterval);

    if (targetDate > new Date().getTime()) { 
        countdownInterval = setInterval(() => {
            requestAnimationFrame(redrawBanner); 
        }, 60000); 
    }


    return bannerElement; 
  });

  api.onPageChange(() => {
    if (!api.container.lookup("service:site-settings").countdown_banner_enabled) {
      if (countdownInterval) clearInterval(countdownInterval);
      const existingBanner = document.querySelector(".custom-countdown-banner");
      if (existingBanner) existingBanner.remove();
    } else {
    }
  });
});
