"use client";

// pages/login.tsx

import { useState, useEffect } from "react";
import Head from "next/head";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupaClient } from "@/lib/supabaseClient";

const Login = () => {
  const supabase = createSupaClient();
  const [redirectDomain, setRedirectDomain] = useState<string>("");

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
          </div>

          <Auth
            supabaseClient={supabase}
            providers={["google", "apple" ]}
            redirectTo={`${redirectDomain}/dashboard`}
            appearance={{ theme: ThemeSupa }}
            socialLayout="horizontal"
          />
        </div>
      </div>
    </>
  );
};

export default Login;
