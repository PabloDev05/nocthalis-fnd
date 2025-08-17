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
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string().required("El usuario es obligatorio"),
    password: Yup.string().required("La contraseña es obligatoria"),
  });

  const initialValues = {
    username: "",
    password: "",
  };

  const handleSubmit = useCallback(
    async (
      values: typeof initialValues,
      { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
      setServerError("");

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
          username: values.username,
          password: values.password,
        });

        if (res.data?.token) {
          // Guardamos token, user, si ya eligió clase y el ObjectId de la clase (si viene)
          login(
            res.data.token,
            values.username,
            res.data.classChosen ?? false,
            null, // no tenemos el nombre de la clase acá; si querés, luego lo resolves con un fetch por id
            res.data.characterClass ?? null
          );

          // (Opcional) limpiar selección temporal previa, por si el user había elegido algo antes
          localStorage.removeItem("selectedClassId");
          localStorage.removeItem("selectedClassName");
          localStorage.removeItem("selectedClassImage");
          localStorage.removeItem("selectedClassDescription");
          localStorage.removeItem("selectedClassJSON");

          if (res.data.classChosen) {
            navigate("/game");
          } else {
            navigate("/select-class");
          }
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

        {/* Formulario posicionado sobre la imagen */}
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
                      htmlFor="username"
                    >
                      Usuario
                    </label>
                    <Field
                      id="username"
                      name="username"
                      type="text"
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Tu usuario..."
                    />
                    <ErrorMessage
                      name="username"
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
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="••••••••"
                    />
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
