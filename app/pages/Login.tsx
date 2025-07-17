import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:3030/api/auth/login", {
        username,
        password,
      });

        if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
        } else {
        setError("Token no recibido del servidor");
        }
    } catch (err: any) {
        setError(err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}

//! Proximas tareas:
// | Funcionalidad                        | Qué hace                                                       |
// | ------------------------------------ | -------------------------------------------------------------- |
// | ✅ Validación con `zod` o `yup`       | Validar inputs del login con mensajes personalizados           |
// | 🛑 Bloqueo de múltiples intentos     | Para evitar brute force                                        |
// | 🧠 Context de usuario / AuthProvider | Para manejar usuario globalmente (te lo puedo armar si querés) |
// | 🔐 Middleware `ProtectedRoute.tsx`   | Para que `/dashboard` no sea accesible sin login               |

