import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PublicBoutique2 from "./PublicBoutique2";
import "./styles.css";
import "./theme.css";
import "./boutique.css";
import "./boutique2.css";
import "./boutique-reference.css";

function Root(){const path=window.location.pathname;return path.startsWith("/admin")?<App/>:<PublicBoutique2/>}
createRoot(document.getElementById("root")!).render(<StrictMode><Root/></StrictMode>);
