import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PublicBoutique from "./PublicBoutique";
import "./styles.css";
import "./theme.css";
import "./boutique.css";

function Root(){const path=window.location.pathname;return path.startsWith("/admin")?<App/>:<PublicBoutique/>}
createRoot(document.getElementById("root")!).render(<StrictMode><Root/></StrictMode>);
