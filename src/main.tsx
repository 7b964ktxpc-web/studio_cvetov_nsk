import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PublicBoutiqueCopy from "./PublicBoutiqueCopy";
import { supabase } from "./lib/supabase";
import "./styles.css";
import "./theme.css";
import "./boutique.css";
import "./boutique2.css";
import "./boutique2-tweaks.css";
import "./boutique-reference.css";

// Supabase warns that async work inside onAuthStateChange can deadlock the
// auth lock. The admin app currently performs async checks in its listener,
// so defer every listener callback to the next macrotask before it runs.
const auth = supabase.auth;
const originalOnAuthStateChange = auth.onAuthStateChange.bind(auth);
auth.onAuthStateChange = ((callback: Parameters<typeof auth.onAuthStateChange>[0]) =>
  originalOnAuthStateChange((event, session) => {
    setTimeout(() => callback(event, session), 0);
  })
) as typeof auth.onAuthStateChange;

function Root(){const path=window.location.pathname;return path.startsWith("/admin")?<App/>:<PublicBoutiqueCopy/>}
createRoot(document.getElementById("root")!).render(<StrictMode><Root/></StrictMode>);
