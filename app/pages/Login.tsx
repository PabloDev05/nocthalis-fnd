import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router";
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PublicRoute from "./PublicRoute";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3030/api";

const Login = () => {
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Email inválido")
      .required("El email es obligatorio"),
    password: Yup.string().required("La contraseña es obligatoria"),
  });

  const initialValues = { email: "", password: "" };

  const handleSubmit = useCallback(
    async (
      values: typeof initialValues,
      { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
      setServerError("");
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: values.email,
          password: values.password,
        });

        if (res.data?.token) {
          const display = res.data?.user?.email ?? values.email;

          login(
            res.data.token,
            display,
            res.data.classChosen ?? false,
            res.data.user?.characterClassName ?? null,
            res.data.characterClass ?? null
          );

          localStorage.removeItem("selectedClassId");
          localStorage.removeItem("selectedClassName");
          localStorage.removeItem("selectedClassImage");
          localStorage.removeItem("selectedClassDescription");
          localStorage.removeItem("selectedClassJSON");

          navigate(res.data.classChosen ? "/game" : "/select-class");
        } else {
          setServerError("Respuesta inválida del servidor");
        }
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          setServerError(
            err.response?.data?.message || "Error al iniciar sesión"
          );
        } else {
          setServerError("Error inesperado al iniciar sesión");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [login, navigate]
  );

  return (
    <PublicRoute>
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Imagen de fondo */}
        <img
          src="/assets/backgrounds/nocthalis-login-bg-8.png"
          alt="Nocthalis"
          className="absolute inset-0 h-full w-full object-cover brightness-105 saturate-110"
          style={{ objectPosition: "left 32% top 18%" }}
        />

        {/* Overlay sutil gris-azulado */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(0deg, rgba(8, 10, 20, 0.25), rgba(8, 10, 20, 0.25))
            `,
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 flex min-h-screen items-center justify-center md:justify-end px-4 md:pr-[8vw]">
          {/* Panel más pequeño y neutro */}
          <div
            className="w-full max-w-xs text-white rounded-xl p-5 border backdrop-blur-md 
                          shadow-[0_12px_40px_rgba(0,0,0,0.55)]
                          bg-[#11131a]/90 border-white/10"
          >
            <h2 className="text-xl font-semibold text-center mb-1 tracking-wide text-gray-100">
              Iniciar sesión
            </h2>
            <p className="text-center text-xs text-gray-400 mb-4">
              Bienvenido a <span className="text-gray-200">Nocthalis</span>
            </p>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-3">
                  {serverError && (
                    <div className="bg-red-900/40 text-red-300 border border-red-600/40 p-2 rounded text-xs">
                      {serverError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs mb-1 text-gray-300"
                    >
                      Email
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-[#0d0f16]/80 border border-gray-600/40 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="tu@email.com"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-400 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs mb-1 text-gray-300"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="w-full bg-[#0d0f16]/80 border border-gray-600/40 rounded px-3 py-1.5 pr-9 text-sm text-white placeholder-gray-400
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="••••••••"
                      />
                      {/* Ojo sobrio */}
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-400 hover:text-gray-200"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          // eye-off
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M3 3l18 18M10.58 10.58A3 3 0 0113.42 13.42M9.88 4.24A9.77 9.77 0 0112 4c5.52 0 10 4 10 8 0 1.25-.37 2.42-1.03 3.45M6.1 6.1C3.64 7.6 2 9.94 2 12c0 4 4.48 8 10 8 1.62 0 3.15-.33 4.49-.93"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          // eye
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-400 text-xs mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-1.5 rounded bg-blue-700 hover:bg-blue-600 transition duration-300 shadow-md 
                                text-white text-sm font-medium
                                ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? "Ingresando..." : "Ingresar"}
                  </button>

                  <div className="pt-2 border-t border-gray-600/30">
                    <p className="text-xs mt-2 text-center text-gray-400">
                      ¿No tienes cuenta?{" "}
                      <Link
                        to="/select-class"
                        className="text-blue-400 hover:underline hover:text-blue-300"
                      >
                        Regístrate aquí
                      </Link>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
};

export default Login;
