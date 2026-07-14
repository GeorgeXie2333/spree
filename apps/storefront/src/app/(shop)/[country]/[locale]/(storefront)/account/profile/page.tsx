"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { updateCustomer } from "@/lib/data/customer";

const inputClassName = "rounded-xl border-border bg-background";

function ProfileForm({
  user,
  refreshUser,
}: {
  user: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  refreshUser: () => Promise<void>;
}) {
  const t = useTranslations("profile");
  const ta = useTranslations("account");
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const emailChanged = formData.email.trim() !== user.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setSaving(true);

    const result = await updateCustomer({
      ...formData,
      ...(emailChanged && { current_password: currentPassword }),
    });

    if (result.success) {
      toast.success(t("profileUpdated"));
      setCurrentPassword("");
      setShowCurrentPassword(false);
      await refreshUser();
    } else {
      const message = result.error || t("failedToUpdate");
      if (emailChanged && /current password/i.test(message)) {
        setPasswordError(message);
      } else {
        setError(message);
      }
    }

    setSaving(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground">
        {t("profile")}
      </h1>

      <div className="overflow-hidden rounded-[18px] bg-card">
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-6 p-6 sm:p-8">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first_name">{t("firstName")}</FieldLabel>
                <Input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className={inputClassName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="last_name">{t("lastName")}</FieldLabel>
                <Input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="email">{t("emailAddress")}</FieldLabel>
              <Input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClassName}
              />
            </Field>

            {emailChanged && (
              <Field>
                <FieldLabel htmlFor="current_password">
                  {t("currentPassword")}
                </FieldLabel>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    id="current_password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="••••••••"
                    className={`${inputClassName} pr-10`}
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby="current_password_help"
                  />
                  <div className="absolute top-1/2 right-1 -translate-y-1/2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      aria-label={
                        showCurrentPassword
                          ? ta("hidePassword")
                          : ta("showPassword")
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <p
                  id="current_password_help"
                  className={`text-sm ${
                    passwordError ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {passwordError || t("currentPasswordHelp")}
                </p>
              </Field>
            )}
          </FieldGroup>

          <div className="flex justify-end border-t border-border px-6 py-4 sm:px-8">
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8 overflow-hidden rounded-[18px] bg-card">
        <div className="border-b border-border px-6 py-4 sm:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("accountInformation")}
          </h2>
        </div>
        <div className="p-6 sm:p-8">
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t("accountId")}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("email")}</dt>
              <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, refreshUser } = useAuth();

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("loadingProfile")}</p>
      </div>
    );
  }

  return <ProfileForm key={user.id} user={user} refreshUser={refreshUser} />;
}
