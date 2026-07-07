"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function isPrivateLanHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  if (hostname.startsWith("192.168.")) return true;
  if (hostname.startsWith("10.")) return true;
  const match = /^172\.(\d+)\./.exec(hostname);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

/**
 * Supabase rechaza IPs privadas (192.168.x.x) en OAuth y devuelve a la Site URL (Vercel).
 * Solo funcionan localhost, dominios https o túneles (trycloudflare, ngrok).
 */
export function OAuthLanNotice() {
  const [lanIp, setLanIp] = useState<string | null>(null);
  const tunnelOrigin = process.env.NEXT_PUBLIC_OAUTH_PUBLIC_ORIGIN?.replace(/\/+$/, "");

  useEffect(() => {
    const { hostname } = window.location;
    if (isPrivateLanHost(hostname)) setLanIp(hostname);
  }, []);

  if (!lanIp) return null;

  const tunnelLogin = tunnelOrigin ? `${tunnelOrigin}/login` : null;

  return (
    <div className="mt-4 rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-950">
      <p className="font-medium">Login con Google no funciona por IP local ({lanIp})</p>
      <p className="mt-2">
        Supabase no permite redirecciones OAuth a direcciones{" "}
        <code className="rounded bg-amber-100/80 px-1">192.168.x.x</code>. Por eso te manda a
        Vercel aunque entres desde tu red Wi‑Fi.
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5">
        <li>
          <strong>En Mac:</strong>{" "}
          <Link href="http://localhost:3002/login" className="underline underline-offset-2">
            http://localhost:3002/login
          </Link>
        </li>
        <li>
          <strong>En iPhone:</strong> usa un túnel HTTPS. En la Mac ejecuta{" "}
          <code className="rounded bg-amber-100/80 px-1">npm run tunnel:oauth</code> y abre la URL{" "}
          <code className="rounded bg-amber-100/80 px-1">https://….trycloudflare.com/login</code>
        </li>
        <li>
          <strong>En producción:</strong>{" "}
          <a
            href="https://radio-shalko-web.vercel.app/login"
            className="underline underline-offset-2"
          >
            radio-shalko-web.vercel.app/login
          </a>
        </li>
      </ul>
      {tunnelLogin && (
        <p className="mt-3">
          Túnel configurado:{" "}
          <a href={tunnelLogin} className="font-medium underline underline-offset-2">
            {tunnelLogin}
          </a>
        </p>
      )}
    </div>
  );
}
