import { useLayoutEffect } from "react";
import PublicBoutique2 from "./PublicBoutique2";

export default function PublicBoutiqueCopy() {
  useLayoutEffect(() => {
    const h1 = document.querySelector(".bt2-hero h1");
    const lead = document.querySelector(".bt2-hero .bt2-lead");
    if (h1) h1.innerHTML = "Цветы,<br />которые<br />говорят за вас";
    if (lead) lead.textContent = "Готовые букеты, авторские композиции и доставка по Новосибирску. Поможем выбрать цветы для подарка, праздника или просто особенного дня.";
  }, []);

  return <PublicBoutique2 />;
}
