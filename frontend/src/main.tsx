import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "../css/app.css";
import "../i18n";
import App from "./App"; // Importamos el componente raíz que crearemos abajo

// Buscamos el div con id "root" (estándar en Vite/React)
const container = document.getElementById("root");

if (!container) {
  throw new Error("No se encontró el elemento raíz 'root' en el HTML.");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);