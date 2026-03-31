import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { GetServerSideProps } from "next";

export default function AuthCallbackPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, res, query } = ctx;
  const code = typeof query.code === "string" ? query.code : null;
  const nextRaw = typeof query.next === "string" ? query.next : "/member/dashboard";
  const nextPath = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      redirect: {
        destination: "/auth/login?error=config",
        permanent: false,
      },
    };
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? "");
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.appendHeader(
            "Set-Cookie",
            serializeCookieHeader(name, value, options as never),
          );
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        redirect: {
          destination: `/auth/login?error=${encodeURIComponent(error.message)}`,
          permanent: false,
        },
      };
    }
    return {
      redirect: { destination: nextPath, permanent: false },
    };
  }

  const tokenHash =
    typeof query.token_hash === "string" ? query.token_hash : null;
  const type = typeof query.type === "string" ? query.type : null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "signup" | "magiclink" | "recovery",
      token_hash: tokenHash,
    });
    if (error) {
      return {
        redirect: {
          destination: `/auth/login?error=${encodeURIComponent(error.message)}`,
          permanent: false,
        },
      };
    }
    return {
      redirect: { destination: nextPath, permanent: false },
    };
  }

  return {
    redirect: {
      destination: "/auth/login?error=oauth",
      permanent: false,
    },
  };
};
