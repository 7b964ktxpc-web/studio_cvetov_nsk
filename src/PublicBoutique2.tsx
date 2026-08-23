import { useEffect, useState, type FormEvent } from "react";
import { Gift, HeartHandshake, MapPin, Menu, Phone, ShieldCheck, Truck, X } from "lucide-react";
import { supabase } from "./lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number | null;
  short_description?: string | null;
  description?: string | null;
  main_image?: string | null;
  images?: string[];
  alt?: string | null;
  category_id?: string | null;
  is_featured?: boolean;
};
type Category = { id: string; name: string; slug: string };
type Review = { id: string; name: string; rating: number | null; body: string; source: string | null };
type Settings = { store_name: string; address: string; phone_1: string; phone_2: string; whatsapp_url: string | null; telegram_url: string | null; working_days: string; working_from: string; working_to: string; delivery_method: string; latitude: number; longitude: number };

const images = [
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1200&q=85",
];
const fallbackProducts: Product[] = [
  { id: "fallback-1", name: "Тихое утро", price: 2990, main_image: images[0], short_description: "Нежная композиция для тёплого повода." },
  { id: "fallback-2", name: "Мягкий фокус", price: 3490, main_image: images[1], short_description: "Воздушный букет в спокойной палитре." },
  { id: "fallback-3", name: "Оливковый воздух", price: 4290, main_image: images[2], short_description: "Выразительная композиция с зеленью." },
  { id: "fallback-4", name: "Тёплое письмо", price: 3990, main_image: images[3], short_description: "Собранный с мягкими кремовыми акцентами." },
  { id: "fallback-5", name: "Праздничный день", price: 4490, main_image: images[4], short_description: "Яркий букет для особенного дня." },
  { id: "fallback-6", name: "Просто так", price: 2490, main_image: images[5], short_description: "Цветы без повода — просто чтобы порадовать." },
];
const defaultSettings: Settings = { store_name: "Студия Цветов", address: "улица Невельского, 3Ак4, Новосибирск", phone_1: "+7 (952) 916-52-15", phone_2: "+7 (993) 028-49-94", whatsapp_url: "https://wa.me/79529165215", telegram_url: "tg://resolve?phone=79529165215", working_days: "Ежедневно", working_from: "09:00", working_to: "21:30", delivery_method: "Яндекс Доставка", latitude: 54.993045, longitude: 82.833637 };

const money = (price: number | null) => price == null ? "Цена по запросу" : `${price.toLocaleString("ru-RU")} ₽`;
const img = (p: Product, index: number) => p.main_image || p.images?.[0] || images[index % images.length];

function useData() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) return;
      setLoading(true);
      const [p, c, r, s] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("categories").select("id,name,slug").eq("is_active", true).order("sort_order"),
        supabase.from("reviews").select("id,name,rating,body,source").eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("store_settings").select("*").eq("id", true).maybeSingle(),
      ]);
      if (!alive) return;
      if (!p.error && p.data?.length) setProducts(p.data as Product[]);
      if (!c.error) setCategories((c.data || []) as Category[]);
      if (!r.error) setReviews((r.data || []) as Review[]);
      if (!s.error && s.data) setSettings(s.data as Settings);
      setLoading(false);
    }
    void load();
    return () => { alive = false; };
  }, []);
  return { products, categories, reviews, settings, loading };
}

function SectionTitle({ children }: { children: string }) {
  return <div className="bt2-title"><h2>{children}</h2><div className="bt2-title-line"><span /></div></div>;
}

function Button({ children, outline = false, onClick, type = "button" }: { children: React.ReactNode; outline?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return <button type={type} className={`bt2-btn ${outline ? "bt2-btn--outline" : ""}`} onClick={onClick}>{children}</button>;
}

export default function PublicBoutique2() {
  const { products, categories, reviews, settings, loading } = useData();
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const best = products.filter(p => p.is_featured).length ? products.filter(p => p.is_featured) : products;
  const [bestIndex, setBestIndex] = useState(0);
  const featured = best.length ? best[bestIndex % best.length] : fallbackProducts[0];
  const prev = best.length ? best[(bestIndex - 1 + best.length) % best.length] : fallbackProducts[5];
  const next = best.length ? best[(bestIndex + 1) % best.length] : fallbackProducts[1];
  const route = `https://yandex.ru/maps/?rtext=~${settings.latitude}%2C${settings.longitude}&rtt=auto`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !selected) { setSent(true); return; }
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("orders").insert({ customer_name: String(fd.get("name") || ""), customer_phone: String(fd.get("phone") || ""), customer_message: String(fd.get("message") || ""), product_id: selected.id.startsWith("fallback-") ? null : selected.id, product_name: selected.name, amount: selected.price, payload: Object.fromEntries(fd.entries()) });
    setBusy(false);
    if (!error) setSent(true);
  }

  return <div className="bt2-site" id="top">
    <header className="bt2-header">
      <a className="bt2-logo" href="#top">СТУДИЯ <span>ЦВЕТОВ</span></a>
      <nav>{[["О нас", "about"], ["Каталог", "catalog"], ["Отзывы", "reviews"], ["Контакты", "contacts"]].map(([label, id]) => <a href={`#${id}`} key={id}>{label}</a>)}</nav>
      <a className="bt2-phone" href={`tel:${settings.phone_1.replace(/\D/g, "")}`}>{settings.phone_1}</a>
      <button className="bt2-menu" onClick={() => setMenu(v => !v)} aria-label="Меню">{menu ? <X /> : <Menu />}</button>
      {menu && <div className="bt2-mobile-menu">{[["О нас", "about"], ["Каталог", "catalog"], ["Отзывы", "reviews"], ["Контакты", "contacts"]].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{label}</a>)}<a href={settings.whatsapp_url || "#"}>WhatsApp</a><a href={settings.telegram_url || "#"}>Telegram</a></div>}
    </header>

    <main>
      <section className="bt2-hero">
        <div className="bt2-hero-copy">
          <p className="bt2-eyebrow">СТУДИЯ ЦВЕТОВ · НОВОСИБИРСК</p>
          <h1>Доставка<br />букетов<br />на заказ</h1>
          <p className="bt2-lead">Собираем цветы вручную и доставляем по Новосибирску. Поможем выбрать букет для любого повода.</p>
          <div className="bt2-actions"><Button outline onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>Подробнее</Button><Button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Выбрать букет</Button></div>
          <div className="bt2-hero-rule"><span /></div>
        </div>
        <div className="bt2-hero-photo"><img src={img(featured, 0)} alt="Букет Студии Цветов" /></div>
      </section>

      <section className="bt2-section bt2-catalog" id="catalog">
        <SectionTitle>Каталог</SectionTitle>
        <p className="bt2-sub">Готовые букеты, которые можно заказать сегодня</p>
        {loading && <div className="bt2-loading">Обновляем каталог…</div>}
        <div className="bt2-grid">{products.slice(0, 6).map((p, i) => <button key={p.id} className="bt2-card" onClick={() => setSelected(p)}><span className="bt2-card-photo"><img src={img(p, i)} alt={p.alt || p.name} /></span><span className="bt2-card-meta"><span><strong>{p.name}</strong><small>{categories.find(c => c.id === p.category_id)?.name || "Букет"}</small></span><b>{money(p.price)}</b><em>Заказать</em></span></button>)}</div>
        <Button onClick={() => document.getElementById("bestsellers")?.scrollIntoView({ behavior: "smooth" })}>Открыть ещё</Button>
      </section>

      <section className="bt2-section bt2-why" id="about">
        <SectionTitle>Почему именно мы?</SectionTitle><p className="bt2-sub">Наши букеты дарят вам самые яркие эмоции</p>
        <div className="bt2-why-grid"><div className="bt2-large-photo"><img src={img(products[3] || fallbackProducts[3], 3)} alt="Авторский букет" /></div><div className="bt2-reasons"><article><HeartHandshake /><h3>Доверие</h3><p>Внимательно собираем каждый заказ и остаёмся на связи.</p></article><article><Truck /><h3>Доставка</h3><p>Передаём букеты через {settings.delivery_method} в удобное время.</p></article><article><ShieldCheck /><h3>Качество</h3><p>Работаем со свежими цветами и проверяем каждую композицию.</p></article><article><Gift /><h3>Подарок</h3><p>Поможем подобрать открытку и красивое оформление.</p></article></div></div>
      </section>

      <section className="bt2-about"><div className="bt2-about-copy"><p>«СТУДИЯ ЦВЕТОВ» — пространство, где цветы помогают сказать самое важное.</p><p>Мы собираем букеты с вниманием к цвету, форме и настроению получателя.</p></div><div className="bt2-about-photo"><img src={img(products[4] || fallbackProducts[4], 4)} alt="Цветочная композиция" /></div></section>

      <section className="bt2-section bt2-best" id="bestsellers"><SectionTitle>Бестселлеры</SectionTitle><div className="bt2-carousel"><button className="bt2-side" onClick={() => setBestIndex(v => Math.max(0, (v - 1 + best.length) % best.length))}><img src={img(prev, 5)} alt={prev.name} /><strong>{prev.name}</strong><small>{money(prev.price)}</small></button><article className="bt2-main-best"><img src={img(featured, 1)} alt={featured.name} /><div><h3>{featured.name}</h3><b>{money(featured.price)}</b><p>{featured.short_description || "Авторский букет для особенного повода."}</p><Button onClick={() => setSelected(featured)}>Заказать букет</Button></div></article><button className="bt2-side" onClick={() => setBestIndex(v => (v + 1) % best.length)}><img src={img(next, 2)} alt={next.name} /><strong>{next.name}</strong><small>{money(next.price)}</small></button></div><div className="bt2-dots">{best.slice(0, 5).map((_, i) => <button key={i} className={i === bestIndex % 5 ? "active" : ""} onClick={() => setBestIndex(i)} />)}</div></section>

      <section className="bt2-florist" id="delivery"><div className="bt2-florist-copy"><SectionTitle>Не подобрали подходящий букет?</SectionTitle><p>Соберём букет лично для вас.</p><small>Оставьте контакты — флорист уточнит пожелания и предложит варианты.</small></div><div className="bt2-form-photo"><img src={img(products[1] || fallbackProducts[1], 1)} alt="Помощь флориста" /><form className="bt2-form" onSubmit={async e => { e.preventDefault(); if (!supabase) return; const fd = new FormData(e.currentTarget); await supabase.from("orders").insert({ customer_name: String(fd.get("name") || ""), customer_phone: String(fd.get("phone") || ""), customer_message: String(fd.get("comment") || ""), product_name: "Помощь флориста", payload: Object.fromEntries(fd.entries()) }); }}><h3>Оставьте свои контактные данные</h3><p>Мы свяжемся с вами и поможем выбрать композицию.</p><input name="name" placeholder="Имя" required /><input name="phone" placeholder="Телефон" required /><textarea name="comment" rows={3} placeholder="Пожелания" /><Button type="submit">Оставить заявку</Button></form></div></section>

      <section className="bt2-section bt2-reviews" id="reviews"><SectionTitle>Отзывы</SectionTitle>{reviews.length ? <div className="bt2-review-grid">{reviews.slice(0, 3).map(r => <article key={r.id}><div className="bt2-avatar">{r.name.slice(0, 1)}</div><h3>{r.name}</h3><div className="bt2-stars">{"★".repeat(r.rating || 5)}</div><p>{r.body}</p><small>{r.source || "Клиент Студии Цветов"}</small></article>)}</div> : <div className="bt2-empty">Реальные отзывы клиентов появятся здесь после публикации из админ-панели.</div>}</section>

      <section className="bt2-section bt2-contacts" id="contacts"><div><SectionTitle>Контакты</SectionTitle><h2>Будем рады<br />собрать цветы<br />для вас</h2><p>{settings.address}</p><p>{settings.working_days} · {settings.working_from}–{settings.working_to}</p><a className="bt2-route" href={route} target="_blank" rel="noreferrer"><MapPin size={17} /> Построить маршрут</a></div><div className="bt2-contact-list"><a href={`tel:${settings.phone_1.replace(/\D/g, "")}`}><Phone size={17} /> {settings.phone_1}</a><a href={`tel:${settings.phone_2.replace(/\D/g, "")}`}><Phone size={17} /> {settings.phone_2}</a><a href={settings.whatsapp_url || "#"}>WhatsApp</a><a href={settings.telegram_url || "#"}>Telegram</a></div></section>
    </main>

    <footer className="bt2-footer"><div><a className="bt2-logo bt2-logo--light" href="#top">СТУДИЯ <span>ЦВЕТОВ</span></a><p>Новосибирск · улица Невельского, 3Ак4</p></div><div><h4>Информация</h4><a href="#about">О нас</a><a href="#catalog">Каталог</a><a href="#reviews">Отзывы</a></div><div><h4>Поддержка</h4><a href="#delivery">Помощь флориста</a><a href="#contacts">Доставка</a><a href="#contacts">Контакты</a></div><div><h4>Контакты</h4><p>{settings.phone_1}</p><p>{settings.phone_2}</p><p>{settings.working_days}<br />{settings.working_from}–{settings.working_to}</p></div></footer>

    {selected && <div className="bt2-modal-backdrop" onMouseDown={() => setSelected(null)}><div className="bt2-modal" onMouseDown={e => e.stopPropagation()}>{sent ? <div className="bt2-success"><h2>Заявка отправлена</h2><p>Мы свяжемся с вами для подтверждения заказа.</p><Button onClick={() => { setSent(false); setSelected(null); }}>Закрыть</Button></div> : <><button className="bt2-close" onClick={() => setSelected(null)} aria-label="Закрыть"><X /></button><img src={img(selected, 0)} alt={selected.name} /><div className="bt2-modal-copy"><p className="bt2-eyebrow">ЗАКАЗ БУКЕТА</p><h2>{selected.name}</h2><b>{money(selected.price)}</b><p>{selected.description || selected.short_description}</p><form onSubmit={submit}><input name="name" placeholder="Имя" required /><input name="phone" placeholder="Телефон" required /><textarea name="message" placeholder="Адрес и пожелания" rows={4} /><Button type="submit">{busy ? "Отправляем…" : "Отправить заказ"}</Button></form></div></>}</div></div>}
  </div>;
}
