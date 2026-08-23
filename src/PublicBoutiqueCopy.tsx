import { useLayoutEffect } from "react";
import PublicBoutique2 from "./PublicBoutique2";

export default function PublicBoutiqueCopy() {
  useLayoutEffect(() => {
    const h1 = document.querySelector(".bt2-hero h1");
    const lead = document.querySelector(".bt2-hero .bt2-lead");
    if (h1) h1.innerHTML = "Цветы,<br />которые<br />говорят за вас";
    if (lead) lead.textContent = "Готовые букеты, авторские композиции и доставка по Новосибирску. Поможем выбрать цветы для подарка, праздника или просто особенного дня.";

    // На телефоне бестселлеры листаются обычным свайпом, а не только точками.
    const carousel = document.querySelector<HTMLElement>(".bt2-best .bt2-carousel");
    if (!carousel) return;
    let startX = 0;
    let startY = 0;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      const sideButtons = carousel.querySelectorAll<HTMLButtonElement>(".bt2-side");
      if (dx < 0) sideButtons[1]?.click();
      else sideButtons[0]?.click();
    };
    carousel.addEventListener("touchstart", onTouchStart, { passive: true });
    carousel.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      carousel.removeEventListener("touchstart", onTouchStart);
      carousel.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return <PublicBoutique2 />;
}
