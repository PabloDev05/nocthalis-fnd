import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router";
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

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
          login(res.data.token, values.username, res.data.classChosen ?? false);
          navigate("/game");
        } else {
          setServerError("Token no recibido del servidor");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {serverError && (
                <div className="bg-red-100 text-red-600 p-2 rounded text-sm">
                  {serverError}
                </div>
              )}

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="username"
                >
                  Usuario
                </label>
                <Field
                  id="username"
                  name="username"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </button>

              <p className="text-sm mt-4 text-center">
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
