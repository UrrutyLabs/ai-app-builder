import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    current: true,
    features: ["Personal use", "Connect 1 repo", "Bring-your-own API keys"],
  },
  {
    name: "Pro",
    price: "Usage-based",
    current: false,
    features: [
      "Team members & roles",
      "Managed model access",
      "Cost & usage analytics",
    ],
  },
];

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Loop has real per-feature LLM costs, so pricing will pair a base plan
          with usage. Billing is coming soon.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="space-y-3 rounded-lg border bg-card p-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">{plan.name}</h2>
              {plan.current ? (
                <Badge variant="secondary">Current</Badge>
              ) : null}
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {plan.price}
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check
                    className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  {f}
                </li>
              ))}
            </ul>
            {!plan.current ? (
              <Button className="w-full" disabled>
                Coming soon
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
