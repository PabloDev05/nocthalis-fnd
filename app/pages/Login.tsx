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
  const [showPassword, setShowPassword] = useState(false); // 👈 nuevo
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

          if (res.data.classChosen) navigate("/game");
          else navigate("/select-class");
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
      <div className="relative w-full h-screen bg-gradient-to-r from-black via-[#080810] to-[#0f0f1c] overflow-hidden">
        <img
          src="/assets/backgrounds/notcthalis-login-bg-6.png"
          alt="Nocthalis"
          className="w-auto h-full object-contain absolute top-0 right-100 left-50 z-0"
        />

        <div className="absolute top-1/2 left-[60%] transform -translate-y-1/2 ">
          <div className="w-[420px] text-white bg-[#0f0f1c]/90 backdrop-blur-md rounded-xl p-8 border border-gray-700 shadow-xl">
            <h2 className="text-3xl font-bold text-center mb-6">
              Iniciar sesión
            </h2>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-5">
                  {serverError && (
                    <div className="bg-red-900/40 text-red-400 border border-red-600 p-3 rounded text-sm">
                      {serverError}
                    </div>
                  )}

                  <div>
                    <label
                      className="block text-sm mb-1 text-gray-300"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="tu@email.com"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-400 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm mb-1 text-gray-300"
                      htmlFor="password"
                    >
                      Contraseña
                    </label>

                    {/* 👇 wrapper para el ojito */}
                    <div className="relative">
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="••••••••"
                      />

                      {/* Botón ojito */}
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-200"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          // eye-off
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
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
                            className="h-5 w-5"
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
                      className="text-red-400 text-sm mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2 rounded bg-[#2f1e4d] hover:bg-[#40235f] transition duration-300 shadow-md text-white ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Ingresando..." : "Ingresar"}
                  </button>

                  <p className="text-sm mt-4 text-center text-gray-400">
                    ¿No tienes cuenta?{" "}
                    <Link
                      to="/select-class"
                      className="text-purple-400 hover:underline hover:text-purple-300"
                    >
                      Regístrate aquí
                    </Link>
                  </p>
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
