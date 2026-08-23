import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, ImagePlus, LogOut, MapPin, Menu, MessageCircle, Phone, Plus, Save, Settings2, ShoppingBag, Star, Trash2, X } from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

const DEFAULT_SETTINGS = {
  store_name: "Студия Цветов",
  address: "улица Невельского, 3Ак4, Новосибирск",
  phone_1: "+7 (952) 916-52-15",
  phone_2: "+7 (993) 028-49-94",
  whatsapp_url: "https://wa.me/79529165215",
  telegram_url: "tg://resolve?phone=79529165215",
  max_url: null,
  working_days: "Ежедневно",
  working_from: "09:00",
  working_to: "21:30",
  timezone: "Asia/Novosibirsk",
  latitude: 54.993045,
  longitude: 82.833637,
  route_url: "https://yandex.ru/maps/?rtext=~54.993045%2C82.833637&rtt=auto",
  delivery_method: "Яндекс Доставка",
  delivery_price: null,
  delivery_zones: null,
  delivery_hours: null,
  minimum_order: null,
  seo_title: "Студия Цветов — цветы с доставкой в Новосибирске",
  seo_description: "Авторские букеты и цветочные композиции с доставкой по Новосибирску.",
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=85",
];

type Product = { id: string; slug: string; name: string; description: string; short_description: string | null; price: number | null; old_price: number | null; category_id: string | null; main_image: string | null; images: string[]; alt: string | null; is_active: boolean; is_featured: boolean; sort_order: number };
type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null; is_active: boolean; sort_order: number };
type Review = { id: string; name: string; review_date: string | null; rating: number | null; body: string; source: string | null; source_url: string | null; is_published: boolean };
type Order = { id: string; status: string; customer_name: string | null; customer_phone: string | null; customer_message: string | null; product_name: string | null; amount: number | null; created_at: string };
type StoreSettings = typeof DEFAULT_SETTINGS & { id: boolean };

function money(value: number | null) { return value == null ? "Цена уточняется" : `${value.toLocaleString("ru-RU")} ₽`; }
function imageFor(p: Product, index = 0) { return p.main_image || p.images?.[0] || fallbackImages[index % fallbackImages.length]; }
function isOpen(settings: StoreSettings) {
  const parts = new Intl.DateTimeFormat("ru-RU", { timeZone: settings.timezone || "Asia/Novosibirsk", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const current = Number(parts.find(x => x.type === "hour")?.value || 0) * 60 + Number(parts.find(x => x.type === "minute")?.value || 0);
  const [fh, fm] = String(settings.working_from).slice(0,5).split(":").map(Number);
  const [th, tm] = String(settings.working_to).slice(0,5).split(":").map(Number);
  return current >= fh * 60 + fm && current < th * 60 + tm;
}

function useStoreData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ id: true, ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    if (!supabase) { setLoading(false); return; }
    const [p, c, r, s] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("reviews").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("store_settings").select("*").eq("id", true).maybeSingle(),
    ]);
    if (!p.error) setProducts((p.data || []) as Product[]);
    if (!c.error) setCategories((c.data || []) as Category[]);
    if (!r.error) setReviews((r.data || []) as Review[]);
    if (!s.error && s.data) setSettings(s.data as StoreSettings);
    setLoading(false);
  };
  useEffect(() => { void refresh(); }, []);
  return { products, categories, reviews, settings, loading, refresh };
}

function Brand() { return <a className="brand" href="/">Студия Цветов</a>; }

export default function App() {
  const path = window.location.pathname;
  if (path === "/admin/login") return <AdminLogin />;
  if (path === "/admin") return <Admin />;
  return <PublicSite />;
}

function PublicSite() {
  const { products, categories, reviews, settings, loading } = useStoreData();
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [orderSent, setOrderSent] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [query, setQuery] = useState("");
  const featured = products.filter(p => p.is_featured).length ? products.filter(p => p.is_featured) : products;
  const open = isOpen(settings);
  async function submitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !selected) return;
    setOrderBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("orders").insert({
      customer_name: String(fd.get("name") || ""),
      customer_phone: String(fd.get("phone") || ""),
      customer_message: String(fd.get("message") || ""),
      product_id: selected.id,
      product_name: selected.name,
      amount: selected.price,
      payload: Object.fromEntries(fd.entries()),
    });
    setOrderBusy(false);
    if (!error) setOrderSent(true);
  }
  return <div className="site-shell">
    <header className="site-header"><Brand /><nav>{[["Каталог","catalog"],["О магазине","about"],["Доставка","delivery"],["Контакты","contacts"]].map(([label,id]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav><div className="header-contact"><a href={`tel:${settings.phone_1.replace(/\D/g,"")}`}>{settings.phone_1}</a><a className="order-button" href="#catalog">Заказать букет</a></div><button className="icon-button menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Меню">{menu?<X/>:<Menu/>}</button>{menu&&<div className="mobile-nav"><a href="#catalog" onClick={()=>setMenu(false)}>Каталог</a><a href="#about" onClick={()=>setMenu(false)}>О магазине</a><a href="#delivery" onClick={()=>setMenu(false)}>Доставка</a><a href="#contacts" onClick={()=>setMenu(false)}>Контакты</a><a href={settings.whatsapp_url || "#"}>WhatsApp</a><a href={settings.telegram_url || "#"}>Telegram</a></div>}</header>
    <main>
      <section className="hero" id="top"><div className="hero-copy"><span className="eyebrow">Студия Цветов · Новосибирск</span><h1>Цветы,<br/>которые говорят<br/>вместо вас.</h1><p>Авторские букеты и композиции с доставкой по Новосибирску.</p><a className="primary-cta" href="#catalog">Смотреть букеты <ArrowRight size={17}/></a><div className="hero-meta"><span>{settings.address}</span><span className={open?"open-status":"closed-status"}>{open?`Открыто до ${settings.working_to}`:`Закрыто · откроемся в ${settings.working_from}`}</span></div></div><img src={fallbackImages[0]} alt="Авторский букет"/></section>
      <section className="intro section" id="about"><div><span className="eyebrow">01 / ABOUT</span><h2>Мы создаём букеты,<br/>которые хочется<br/>запомнить.</h2></div><div className="intro-copy"><p>Собираем композиции вручную, подбирая цветы, фактуры и оттенки под ваш повод и настроение.</p><span>Невельского, 3Ак4 · Новосибирск</span></div></section>
      <section className="section category-section" id="catalog"><span className="eyebrow">02 / CATALOG</span><div className="section-title-row"><h2>Цветы на любой повод</h2><span>{products.length} позиций</span></div><div className="category-list">{categories.map(c=><a key={c.id} href="#products"><span>{c.name}</span><ArrowRight size={18}/></a>)}</div></section>
      <section className="section" id="products"><div className="section-title-row"><div><span className="eyebrow">BESTSELLERS</span><h2>Избранные букеты</h2></div><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти букет"/></div>{loading?<div className="loading">Загружаем каталог…</div>:<div className="product-grid">{featured.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).map((p,i)=><article className="product-card" key={p.id}><img src={imageFor(p,i)} alt={p.alt || p.name}/><div className="product-info"><span className="eyebrow">{categories.find(c=>c.id===p.category_id)?.name || "Букет"}</span><h3>{p.name}</h3><p>{p.short_description || p.description}</p><div className="product-bottom"><strong>{money(p.price)}</strong><button onClick={()=>setSelected(p)}>Заказать</button></div></div></article>)}</div>}</section>
      <section className="split-section section"><div><span className="eyebrow">03 / DELIVERY</span><h2>Цветы приедут<br/>туда, где их ждут.</h2><p>Доставку осуществляем через Яндекс Доставку. Стоимость рассчитывается в зависимости от адреса и условий заказа.</p><a className="text-link" href="#contacts">Узнать больше <ArrowRight size={16}/></a></div><div className="delivery-steps">{["Вы выбираете букет","Мы собираем его вручную","Передаём курьеру","Букет приезжает получателю"].map((x,i)=><div key={x}><span>0{i+1}</span><p>{x}</p></div>)}</div></section>
      <section className="photo-panel"><img src={fallbackImages[2]} alt="Композиция из свежих цветов"/><div><span className="eyebrow">FLOWERS & MOMENTS</span><h2>Иногда один букет говорит больше слов.</h2><a className="primary-cta" href="#products">Выбрать букет <ArrowRight size={17}/></a></div></section>
      <section className="section reviews" id="reviews"><div className="section-title-row"><div><span className="eyebrow">04 / REVIEWS</span><h2>Нам доверяют</h2></div></div>{reviews.length?<div className="review-grid">{reviews.map(r=><article className="review-card" key={r.id}><div className="stars">{Array.from({length:r.rating || 5}).map((_,i)=><Star key={i} size={15} fill="currentColor"/>)}</div><p>“{r.body}”</p><div><strong>{r.name}</strong><span>{r.source || "Отзыв клиента"}</span></div></article>)}</div>:<div className="empty-review">Реальные отзывы скоро появятся здесь.</div>}</section>
      <section className="contact-section" id="contacts"><div><span className="eyebrow">05 / CONTACTS</span><h2>Загляните к нам</h2><p>{settings.address}</p><p>{settings.working_days} · {settings.working_from}–{settings.working_to}</p></div><div className="contact-actions"><a href={`tel:${settings.phone_1.replace(/\D/g,"")}`}><Phone size={18}/>{settings.phone_1}</a><a href={`tel:${settings.phone_2.replace(/\D/g,"")}`}><Phone size={18}/>{settings.phone_2}</a><a href={settings.whatsapp_url || `https://wa.me/79529165215`}><MessageCircle size={18}/>WhatsApp</a><a href={`https://yandex.ru/maps/?rtext=~${settings.latitude}%2C${settings.longitude}&rtt=auto`}><MapPin size={18}/>Построить маршрут</a></div></section>
    </main>
    <footer className="footer"><Brand/><span>Ежедневно {settings.working_from}–{settings.working_to}</span><span>© {new Date().getFullYear()} Студия Цветов</span></footer>
    {selected&&<div className="modal-backdrop" onMouseDown={()=>setSelected(null)}><div className="order-modal" onMouseDown={e=>e.stopPropagation()}>{orderSent?<><div className="success-mark"><Check/></div><h2>Спасибо за заказ</h2><p>Мы получили заявку и свяжемся с вами для подтверждения.</p><button className="primary-cta" onClick={()=>{setOrderSent(false);setSelected(null)}}>Закрыть</button></>:<><div className="modal-head"><div><span className="eyebrow">ЗАКАЗ</span><h2>{selected.name}</h2><strong>{money(selected.price)}</strong></div><button className="icon-button" onClick={()=>setSelected(null)}><X/></button></div><form className="order-form" onSubmit={submitOrder}><label>Имя<input name="name" required/></label><label>Телефон<input name="phone" required/></label><label>Комментарий<textarea name="message" placeholder="Адрес, повод, пожелания"/></label><button className="primary-cta" disabled={orderBusy}>{orderBusy?"Отправляем…":"Оформить заказ"}<ArrowRight size={17}/></button></form></>}</div></div>}
  </div>;
}

function AdminLogin() {
  const [email,setEmail]=useState("admin@studio-cvetov.ru"); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setError("");if(!supabase){setError("Не настроен Supabase");return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setError(error.message);return;}window.location.href="/admin";}
  return <div className="admin-page login-page"><div className="login-card"><Brand/><span className="eyebrow">ADMIN</span><h1>Вход в CMS</h1><form onSubmit={submit}><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label><label>Пароль<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>{error&&<p className="form-error">{error}</p>}<button className="primary-cta" disabled={busy}>{busy?"Входим…":"Войти"}<ArrowRight size={17}/></button></form></div></div>;
}

function Admin(){
  const [authLoading,setAuthLoading]=useState(true); const [isAdmin,setIsAdmin]=useState(false); const [tab,setTab]=useState("products"); const [products,setProducts]=useState<Product[]>([]); const [categories,setCategories]=useState<Category[]>([]); const [reviews,setReviews]=useState<Review[]>([]); const [orders,setOrders]=useState<Order[]>([]); const [settings,setSettings]=useState<StoreSettings>({id:true,...DEFAULT_SETTINGS}); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const [product,setProduct]=useState<Partial<Product>>({is_active:true,is_featured:false,sort_order:0,images:[]}); const [category,setCategory]=useState<Partial<Category>>({is_active:true,sort_order:0}); const [review,setReview]=useState<Partial<Review>>({is_published:false,rating:5});
  const load=async()=>{if(!supabase)return;const {data:user}=await supabase.auth.getUser();if(!user.user){window.location.href="/admin/login";return;}const {data:admin}=await supabase.from("admin_users").select("user_id").eq("user_id",user.user.id).maybeSingle();if(!admin){await supabase.auth.signOut();window.location.href="/admin/login";return;}setIsAdmin(true);const [p,c,r,o,s]=await Promise.all([supabase.from("products").select("*").order("sort_order"),supabase.from("categories").select("*").order("sort_order"),supabase.from("reviews").select("*").order("created_at",{ascending:false}),supabase.from("orders").select("*").order("created_at",{ascending:false}),supabase.from("store_settings").select("*").eq("id",true).maybeSingle()]);if(!p.error)setProducts((p.data||[]) as Product[]);if(!c.error)setCategories((c.data||[]) as Category[]);if(!r.error)setReviews((r.data||[]) as Review[]);if(!o.error)setOrders((o.data||[]) as Order[]);if(s.data)setSettings(s.data as StoreSettings);setAuthLoading(false);};
  useEffect(()=>{void load();},[]);
  if(authLoading)return <div className="admin-page"><div className="loading">Проверяем доступ…</div></div>;
  if(!isAdmin)return null;
  const saveProduct=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setMessage("");const payload={name:String(product.name||"").trim(),slug:String(product.slug||"").trim(),description:String(product.description||""),short_description:product.short_description||null,price:product.price===null||product.price===undefined?null:Number(product.price),old_price:product.old_price===null||product.old_price===undefined?null:Number(product.old_price),category_id:product.category_id||null,main_image:product.main_image||null,images:product.main_image?[product.main_image]:[],alt:product.alt||null,is_active:product.is_active!==false,is_featured:product.is_featured===true,sort_order:Number(product.sort_order)||0,updated_at:new Date().toISOString()};const q=product.id?supabase.from("products").update(payload).eq("id",product.id):supabase.from("products").insert(payload);const {error}=await q;setBusy(false);if(error)setMessage(error.message);else{setMessage("Товар сохранён");setProduct({is_active:true,is_featured:false,sort_order:0,images:[]});await load();}};
  const upload=async(file:File)=>{if(!supabase)return;setBusy(true);const ext=file.name.split(".").pop()||"jpg";const path=`${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from("product-images").upload(path,file,{contentType:file.type});if(!error){const {data}=supabase.storage.from("product-images").getPublicUrl(path);setProduct(p=>({...p,main_image:data.publicUrl}));}else setMessage(error.message);setBusy(false);};
  const saveCategory=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;const payload={name:String(category.name||"").trim(),slug:String(category.slug||"").trim(),description:category.description||null,image_url:category.image_url||null,is_active:category.is_active!==false,sort_order:Number(category.sort_order)||0,updated_at:new Date().toISOString()};const {error}=category.id?await supabase.from("categories").update(payload).eq("id",category.id):await supabase.from("categories").insert(payload);setMessage(error?error.message:"Категория сохранена");if(!error){setCategory({is_active:true,sort_order:0});await load();}};
  const saveReview=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;const payload={name:String(review.name||"").trim(),review_date:review.review_date||null,rating:Number(review.rating||5),body:String(review.body||"").trim(),source:review.source||null,source_url:review.source_url||null,is_published:review.is_published===true,updated_at:new Date().toISOString()};const {error}=review.id?await supabase.from("reviews").update(payload).eq("id",review.id):await supabase.from("reviews").insert(payload);setMessage(error?error.message:"Отзыв сохранён");if(!error){setReview({is_published:false,rating:5});await load();}};
  const saveSettings=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;const {error}=await supabase.from("store_settings").upsert(settings,{onConflict:"id"});setMessage(error?error.message:"Настройки сохранены");if(!error)await load();};
  async function remove(table:string,id:string){if(!supabase||!confirm("Удалить запись?"))return;const {error}=await supabase.from(table).delete().eq("id",id);setMessage(error?error.message:"Удалено");if(!error)await load();}
  async function status(id:string,status:string){if(!supabase)return;const {error}=await supabase.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);if(error)setMessage(error.message);else await load();}
  return <div className="admin-page"><aside className="admin-sidebar"><Brand/><span className="eyebrow">CMS</span>{[["products","Товары"],["categories","Категории"],["orders","Заказы"],["reviews","Отзывы"],["settings","Настройки"]].map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}<div className="sidebar-bottom"><a href="/">Открыть сайт</a><button onClick={async()=>{await supabase?.auth.signOut();window.location.href="/admin/login"}}><LogOut size={15}/>Выйти</button></div></aside><section className="admin-content"><div className="admin-top"><div><span className="eyebrow">Студия Цветов</span><h1>{tab===`products`?"Товары":tab===`categories`?"Категории":tab===`orders`?"Заказы":tab===`reviews`?"Отзывы":"Настройки"}</h1></div><div className="admin-stats"><span>{products.length} товаров</span><span>{orders.filter(o=>o.status==="new").length} новых заказа</span></div></div>{message&&<div className="admin-message">{message}</div>}
  {tab==="products"&&<div className="admin-grid"><div className="panel"><div className="panel-head"><div><h2>Каталог</h2><p>Изменения сразу попадают на публичный сайт.</p></div><button className="secondary-button" onClick={()=>setProduct({is_active:true,is_featured:false,sort_order:0,images:[]})}><Plus size={16}/>Новый букет</button></div>{products.map((p,i)=><div className="admin-row" key={p.id}><img src={imageFor(p,i)} alt=""/><div><strong>{p.name}</strong><span>{money(p.price)} · {p.is_active?"активен":"скрыт"}</span></div><button className="small-button" onClick={()=>setProduct(p)}>Изменить</button><button className="danger-button" onClick={()=>void remove("products",p.id)}><Trash2 size={15}/></button></div>)}</div><form className="panel form-panel" onSubmit={saveProduct}><h2>{product.id?"Редактировать букет":"Новый букет"}</h2><label>Название<input value={product.name||""} onChange={e=>setProduct(p=>({...p,name:e.target.value}))} required/></label><label>Slug<input value={product.slug||""} onChange={e=>setProduct(p=>({...p,slug:e.target.value}))} required/></label><label>Описание<textarea value={product.description||""} onChange={e=>setProduct(p=>({...p,description:e.target.value}))}/></label><div className="two-col"><label>Цена<input type="number" value={product.price ?? ""} onChange={e=>setProduct(p=>({...p,price:e.target.value as never}))}/></label><label>Старая цена<input type="number" value={product.old_price ?? ""} onChange={e=>setProduct(p=>({...p,old_price:e.target.value as never}))}/></label></div><label>Категория<select value={product.category_id||""} onChange={e=>setProduct(p=>({...p,category_id:e.target.value}))}><option value="">Без категории</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Фото<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/><input value={product.main_image||""} onChange={e=>setProduct(p=>({...p,main_image:e.target.value}))} placeholder="или URL изображения"/></label>{product.main_image&&<img className="preview-image" src={product.main_image} alt="Предпросмотр"/>}<label className="check"><input type="checkbox" checked={product.is_active!==false} onChange={e=>setProduct(p=>({...p,is_active:e.target.checked}))}/>Показывать на сайте</label><label className="check"><input type="checkbox" checked={product.is_featured===true} onChange={e=>setProduct(p=>({...p,is_featured:e.target.checked}))}/>Избранный букет</label><button className="primary-cta" disabled={busy}><Save size={16}/>{busy?"Сохраняем…":"Сохранить букет"}</button></form></div>}
  {tab==="categories"&&<div className="admin-grid"><div className="panel">{categories.map(c=><div className="admin-row" key={c.id}><div><strong>{c.name}</strong><span>{c.slug} · {c.is_active?"активна":"скрыта"}</span></div><button className="small-button" onClick={()=>setCategory(c)}>Изменить</button><button className="danger-button" onClick={()=>void remove("categories",c.id)}><Trash2 size={15}/></button></div>)}</div><form className="panel form-panel" onSubmit={saveCategory}><h2>{category.id?"Редактировать категорию":"Новая категория"}</h2><label>Название<input value={category.name||""} onChange={e=>setCategory(c=>({...c,name:e.target.value}))} required/></label><label>Slug<input value={category.slug||""} onChange={e=>setCategory(c=>({...c,slug:e.target.value}))} required/></label><label>Описание<textarea value={category.description||""} onChange={e=>setCategory(c=>({...c,description:e.target.value}))}/></label><label>Изображение<input value={category.image_url||""} onChange={e=>setCategory(c=>({...c,image_url:e.target.value}))}/></label><label className="check"><input type="checkbox" checked={category.is_active!==false} onChange={e=>setCategory(c=>({...c,is_active:e.target.checked}))}/>Показывать категорию</label><button className="primary-cta"><Save size={16}/>Сохранить категорию</button></form></div>}
  {tab==="reviews"&&<div className="admin-grid"><div className="panel">{reviews.map(r=><div className="admin-row" key={r.id}><div><strong>{r.name}</strong><span>{r.rating}/5 · {r.is_published?"опубликован":"скрыт"}</span></div><button className="small-button" onClick={()=>setReview(r)}>Изменить</button><button className="danger-button" onClick={()=>void remove("reviews",r.id)}><Trash2 size={15}/></button></div>)}</div><form className="panel form-panel" onSubmit={saveReview}><h2>{review.id?"Редактировать отзыв":"Новый отзыв"}</h2><label>Имя<input value={review.name||""} onChange={e=>setReview(r=>({...r,name:e.target.value}))} required/></label><label>Текст<textarea value={review.body||""} onChange={e=>setReview(r=>({...r,body:e.target.value}))} required/></label><div className="two-col"><label>Оценка<input type="number" min="1" max="5" value={review.rating||5} onChange={e=>setReview(r=>({...r,rating:Number(e.target.value)}))}/></label><label>Источник<input value={review.source||""} onChange={e=>setReview(r=>({...r,source:e.target.value}))}/></label></div><label>Ссылка на отзыв<input value={review.source_url||""} onChange={e=>setReview(r=>({...r,source_url:e.target.value}))}/></label><label className="check"><input type="checkbox" checked={review.is_published===true} onChange={e=>setReview(r=>({...r,is_published:e.target.checked}))}/>Опубликовать</label><button className="primary-cta"><Save size={16}/>Сохранить отзыв</button></form></div>}
  {tab==="orders"&&<div className="panel orders-panel">{orders.length?orders.map(o=><div className="order-row" key={o.id}><div><strong>{o.product_name||"Заказ"}</strong><span>{o.customer_name||"Без имени"} · {o.customer_phone||"Без телефона"}</span><small>{new Date(o.created_at).toLocaleString("ru-RU")}</small></div><select value={o.status} onChange={e=>void status(o.id,e.target.value)}><option value="new">Новый</option><option value="confirmed">Подтверждён</option><option value="in_progress">В работе</option><option value="ready">Готов</option><option value="delivering">Доставляется</option><option value="completed">Завершён</option><option value="cancelled">Отменён</option></select></div>):<div className="empty-review">Заказов пока нет.</div>}</div>}
  {tab==="settings"&&<form className="panel form-panel settings-form" onSubmit={saveSettings}><h2>Настройки магазина</h2><div className="two-col"><label>Название<input value={settings.store_name} onChange={e=>setSettings(s=>({...s,store_name:e.target.value}))}/></label><label>График<input value={`${settings.working_from}–${settings.working_to}`} disabled/></label></div><label>Адрес<input value={settings.address} onChange={e=>setSettings(s=>({...s,address:e.target.value}))}/></label><div className="two-col"><label>Телефон 1<input value={settings.phone_1} onChange={e=>setSettings(s=>({...s,phone_1:e.target.value}))}/></label><label>Телефон 2<input value={settings.phone_2} onChange={e=>setSettings(s=>({...s,phone_2:e.target.value}))}/></label></div><div className="two-col"><label>WhatsApp<input value={settings.whatsapp_url||""} onChange={e=>setSettings(s=>({...s,whatsapp_url:e.target.value}))}/></label><label>Telegram<input value={settings.telegram_url||""} onChange={e=>setSettings(s=>({...s,telegram_url:e.target.value}))}/></label></div><div className="two-col"><label>Широта<input type="number" value={settings.latitude} onChange={e=>setSettings(s=>({...s,latitude:Number(e.target.value)}))}/></label><label>Долгота<input type="number" value={settings.longitude} onChange={e=>setSettings(s=>({...s,longitude:Number(e.target.value)}))}/></label></div><label>Доставка<input value={settings.delivery_method} onChange={e=>setSettings(s=>({...s,delivery_method:e.target.value}))}/></label><div className="two-col"><label>SEO title<input value={settings.seo_title||""} onChange={e=>setSettings(s=>({...s,seo_title:e.target.value}))}/></label><label>SEO description<input value={settings.seo_description||""} onChange={e=>setSettings(s=>({...s,seo_description:e.target.value}))}/></label></div><button className="primary-cta"><Save size={16}/>Сохранить настройки</button></form>}
  </section></div>;
}
