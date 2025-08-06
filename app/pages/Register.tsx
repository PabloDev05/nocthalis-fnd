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

  const selectedClass = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selectedClass");
  }, []);

  const classData: Record<string, { image: string; description: string }> = {
    Asesino: {
      image: "/assets/classes/asesino/asesino_class_1.png",
      description:
        "Sombra sigilosa entre ruinas olvidadas. Su hoja envenenada susurra muerte.",
    },
    Guerrero: {
      image: "/assets/classes/guerrero/guerrero_class_1.png",
      description:
        "Fuerza bruta y escudo inquebrantable. Avanza sin temor en la oscuridad.",
    },
    Mago: {
      image: "/assets/classes/mago/mago_class_1.png",
      description:
        "Sabio de lo arcano. Su poder elemental arde en los confines del abismo.",
    },
    Arquero: {
      image: "/assets/classes/arquero/arquero_class_1.png",
      description:
        "Silencioso y letal desde las sombras. Sus flechas nunca fallan.",
    },
  };

  const currentClass = selectedClass ? classData[selectedClass] : null;

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
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0c0c1a] to-black text-white flex items-center justify-center px-4">
        <div className="flex flex-col md:flex-row items-start gap-6 bg-[#0e0f1c]/80 p-8 rounded-xl shadow-xl border border-[#1e1f2b] max-w-4xl w-full transition-all duration-500">
          {currentClass && (
            <div className="md:w-1/2 flex flex-col items-center self-start">
              <div className="rounded-lg overflow-hidden shadow-xl border border-gray-700 transition duration-300 hover:shadow-purple-800/50">
                <img
                  src={currentClass.image}
                  alt={selectedClass ? selectedClass : "Clase seleccionada"}
                  className="w-56 h-auto object-cover"
                />
              </div>
              <h2 className="text-xl font-bold mt-4">{selectedClass}</h2>
              <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">
                {currentClass.description}
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

                  <Field
                    name="password"
                    type="password"
                    placeholder="Contraseña"
                    className="w-full p-2 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <Field
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirmar contraseña"
                    className="w-full p-2 bg-[#1c1d2b] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
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
                    disabled={isSubmitting}
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
