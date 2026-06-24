"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Org records are managed by Neon Auth (Better Auth org plugin), not our DB,
// so this validation lives with the form rather than in @repo/domain.
const OrgSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
});
type OrgSettingsValues = z.infer<typeof OrgSettingsSchema>;

export function OrgSettingsForm({
  orgId,
  name,
  slug,
}: {
  orgId: string;
  name: string;
  slug: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrgSettingsValues>({
    resolver: zodResolver(OrgSettingsSchema),
    defaultValues: { name, slug },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.organization.update({
      organizationId: orgId,
      data: { name: values.name, slug: values.slug },
    });
    if (error) {
      toast.error(error.message ?? "Could not update organization");
      return;
    }
    toast.success("Organization updated");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-slug">Slug</Label>
        <Input id="org-slug" {...register("slug")} />
        {errors.slug ? (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Used in URLs. Lowercase letters, numbers, and hyphens.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
