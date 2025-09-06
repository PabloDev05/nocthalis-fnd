// src/pages/Register.tsx
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import PublicRoute from "./PublicRoute";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3030/api";
const isValidObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

const Register = () => {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated, classChosen } = useAuth();

  const selectedClassId = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : localStorage.getItem("selectedClassId"),
    []
  );
  const selectedClassName = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : localStorage.getItem("selectedClassName"),
    []
  );
  const selectedClassImage = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : localStorage.getItem("selectedClassImage"),
    []
  );
  const selectedClassDescription = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : (localStorage.getItem("selectedClassDescription") ?? ""),
    []
  );

  useEffect(() => {
    if (isAuthenticated && classChosen) navigate("/game");
  }, [isAuthenticated, classChosen, navigate]);

  useEffect(() => {
    if (!selectedClassId) navigate("/select-class");
  }, [selectedClassId, navigate]);

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

    if (!selectedClassId || !isValidObjectId(selectedClassId)) {
      setServerError("Clase inválida. Volvé a seleccionarla.");
      setSubmitting(false);
      navigate("/select-class");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        characterClass: selectedClassId,
      });

      // ✅ ahora validamos por token (userId ya no viene en la raíz)
      if (res.data?.token) {
        login(
          res.data.token,
          values.email, // guardamos email en el AuthContext
          true,
          res.data.characterClassName ?? selectedClassName ?? null,
          res.data.characterClassId ?? res.data.characterClass ?? null
        );

        // limpiar selección temporal
        localStorage.removeItem("selectedClassId");
        localStorage.removeItem("selectedClassName");
        localStorage.removeItem("selectedClassImage");
        localStorage.removeItem("selectedClassDescription");
        localStorage.removeItem("selectedClassJSON");

        setSuccess(res.data.message || "Usuario registrado correctamente");
        navigate("/game"); // navegación directa
      } else {
        setServerError("Respuesta inválida del servidor");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const raw = err.response?.data?.message || "Error al registrar";
        const msg = /existe|duplicado|duplicate|E11000/i.test(raw)
          ? "Usuario o email ya registrado."
          : raw;
        setServerError(msg);
      } else {
        setServerError("Error inesperado al registrar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0c0c1a] to-black text-white flex items-center justify-center px-4">
        <div className="flex flex-col md:flex-row items-start gap-6 bg-[#0e0f1c]/80 p-8 rounded-xl shadow-xl border border-[#1e1f2b] max-w-4xl w-full transition-all duration-500">
          {selectedClassName && (
            <div className="md:w-1/2 flex flex-col items-center self-start">
              <div className="rounded-lg overflow-hidden shadow-xl border border-gray-700 transition duration-300 hover:shadow-purple-800/50">
                <img
                  src={selectedClassImage || ""}
                  alt={selectedClassName}
                  className="w-56 h-auto object-cover"
                />
              </div>
              <h2 className="text-xl font-bold mt-4">{selectedClassName}</h2>
              <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">
                {selectedClassDescription}
              </p>
            </div>
          )}

          <div className="w-full md:w-1/2 bg-[#14151f] p-6 rounded-lg shadow-md border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <Field
                    name="username"
                    placeholder="Nombre de usuario"
                    className="w-full p-2 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <Field
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full p-2 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  {/* Password con ojito */}
                  <div className="relative">
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      className="w-full p-2 pr-10 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  {/* Confirm Password con ojito */}
                  <div className="relative">
                    <Field
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar contraseña"
                      className="w-full p-2 pr-10 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  {serverError && (
                    <p className="text-red-500 text-sm">{serverError}</p>
                  )}
                  {success && (
                    <p className="text-green-500 text-sm">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedClassId ||
                      !isValidObjectId(selectedClassId)
                    }
                    className={`w-full py-2 rounded bg-[#2f1e4d] hover:bg-[#40235f] transition duration-300 shadow-md text-white ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Registrando..." : "Registrarse"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
};

export default Register;
