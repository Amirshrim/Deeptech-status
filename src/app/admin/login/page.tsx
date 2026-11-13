import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { getAdminSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/route-guard";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Deep-Tech Admin — כניסה",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  if (await getAdminSession()) redirect(target);

  return (
    <main className="dt-entry dt-on-navy flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        <div className="flex justify-center">
          <Brand compact />
        </div>
        <div className="dt-card flex flex-col gap-5">
          <h1 className="text-2xl text-navy-deep text-center">
            <bdi dir="ltr">Deep-Tech Admin</bdi>
          </h1>
          <LoginForm next={target} />
        </div>
        <p className="m-0 text-center text-sm text-white/80">לצוות המועדון בלבד</p>
      </div>
    </main>
  );
}
