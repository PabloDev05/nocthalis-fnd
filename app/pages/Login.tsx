// Login.tsx
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router";
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PublicRoute from "./PublicRoute";

const API_BASE_URL = "http://localhost:3030/api";

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

        if (res.data.token) {
          login(
            res.data.token,
            values.username,
            res.data.classChosen ?? false,
            res.data.characterClass ?? ""
          );

          if (res.data.classChosen) {
            navigate("/game");
          } else {
            navigate("/choose-class");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="bg-gray-900/70 border border-gray-700 shadow-lg rounded-2xl p-8 w-full max-w-md text-white backdrop-blur-md">
          <h2 className="text-3xl font-bold text-center mb-6 tracking-wide text-gray-100">
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
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
    </PublicRoute>
  );
};

export default Login;
