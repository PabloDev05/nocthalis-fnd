import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import PublicRoute from "./PublicRoute";

const API_BASE_URL = "http://localhost:3030/api";

const Register = () => {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const { login, isAuthenticated, classChosen } = useAuth();

  // Leer selectedClass solo una vez
  const selectedClass = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selectedClass");
  }, []);

  useEffect(() => {
    if (isAuthenticated && classChosen) {
      navigate("/game");
    }
  }, [isAuthenticated, classChosen, navigate]);

  const validationSchema = Yup.object({
    username: Yup.string().required("El nombre de usuario es obligatorio"),
    email: Yup.string()
      .email("Correo electrónico inválido")
      .required("El correo es obligatorio"),
    password: Yup.string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .required("La contraseña es obligatoria"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
      .required("Debes confirmar tu contraseña"),
  });

  const initialValues = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: FormikHelpers<typeof initialValues>
  ) => {
    setServerError("");
    setSuccess("");

    if (!selectedClass) {
      setServerError("Debes seleccionar una clase antes de registrarte.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: values.username,
        email: values.email,
        password: values.password,
        characterClass: selectedClass,
      });

      if (res.data.userId && res.data.token) {
        login(res.data.token, values.username, true, selectedClass);
        setSuccess(res.data.message);
        setTimeout(() => navigate("/game"), 1000);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicRoute>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Registro</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <Field
                  name="username"
                  placeholder="Nombre de usuario"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <div>
                <Field
                  name="email"
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <div>
                <Field
                  name="password"
                  type="password"
                  placeholder="Contraseña"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              <div>
                <Field
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmar contraseña"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}
              {success && <p className="text-green-500 text-sm">{success}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white py-2 rounded ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Registrando..." : "Registrarse"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </PublicRoute>
  );
};

export default Register;
