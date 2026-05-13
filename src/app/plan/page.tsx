import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { ConstraintForm } from "@/components/plan/constraint-form";

export const metadata: Metadata = {
  title: "Build Your Meal Plan — NutriPlan",
  description:
    "Describe your dietary needs and get a personalized 7-day meal plan with a ready-to-shop grocery list.",
};

export default function PlanPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Meal Planner
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Build your week.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Describe how you eat — allergies, macros, cuisines, family
            preferences — and we will generate a full 7-day plan with a
            ready-to-shop grocery list.
          </p>
        </div>
        <ConstraintForm />
      </main>
      <SiteFooter />
    </>
  );
}
