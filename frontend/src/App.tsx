import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importa tus páginas existentes
import Login from "./pages/Home/Login";
import Dashboard from "./pages/Dashboard/Index";
import Onboard from "./pages/Home/Onboard";
// Importa el resto de tus páginas aquí...

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas (Lógica de protección a implementar luego) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboard" element={<Onboard />} />

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Ruta 404 */}
        <Route path="*" element={<div>404 - No encontrado</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;