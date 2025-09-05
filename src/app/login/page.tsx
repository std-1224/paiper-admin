"use client";

// pages/login.tsx

import { useState, useEffect } from "react";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupaClient } from "@/lib/supabaseClient";

const Login = () => {
  const supabase = createSupaClient();
  const searchParams = useSearchParams();
  const [redirectDomain, setRedirectDomain] = useState<string>("");
  const status = searchParams.get("status");

  useEffect(() => {
    setRedirectDomain(window.location.origin);
  }, []);

  return (
    <>
      <Head>
        <title>Iniciar sesión</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100 w-[100vw]">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Iniciar sesión
            </h2>
            {status === "pending" && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Cuenta pendiente de aprobación
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Tu cuenta ha sido creada exitosamente, pero está pendiente de aprobación por un administrador.
                        Te notificaremos por correo electrónico cuando tu cuenta sea aprobada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Auth
            supabaseClient={supabase}
            providers={["google"]}
            redirectTo={`${redirectDomain}/auth/callback`}
            appearance={{ theme: ThemeSupa }}
            socialLayout="horizontal"
          />
        </div>
      </div>
    </>
  );
};

export default Login;
