import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "@/components/Common/ErrorBoundary";
import { installDomMutationGuard } from "@/utils/domMutationGuard";
import "./index.css";

installDomMutationGuard();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Element #root introuvable dans index.html");
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
