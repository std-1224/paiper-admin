"use client";

import "./globals.css";

import React, { useState, useEffect } from "react";
import Layout from "@/app/(components)/layout";
import Head from "next/head";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function App({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Set light mode by default
  useEffect(() => {
    document.documentElement.classList.add("light");
  }, []);

  const getLayout = () => {
    if (pathname.startsWith("/login")) {
      return children;
    } else {
      return <Layout>{children}</Layout>;
    }
  };

  return (
    <html lang="es">
      <body>
        <Head>
          <title>Paiper </title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Toaster />
        <Sonner />
          <AuthProvider>
            <AppProvider>
              {getLayout()}
            </AppProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
