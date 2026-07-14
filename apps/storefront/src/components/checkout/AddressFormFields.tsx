"use client";

import type { Country, State } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { AddressFormData } from "@/lib/utils/address";

interface AddressFormFieldsProps {
  address: AddressFormData;
  countries: Country[];
  states: State[];
  loadingStates: boolean;
  onChange: (field: keyof AddressFormData, value: string) => void;
  idPrefix: string;
}

export function AddressFormFields({
  address,
  countries,
  states,
  loadingStates,
  onChange,
  idPrefix,
}: AddressFormFieldsProps) {
  const t = useTranslations("address");
  const tc = useTranslations("common");
  const hasStates = states.length > 0;

  return (
    <FieldGroup className="gap-3">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-country`} className="sr-only">
          {t("country")}
        </FieldLabel>
        <NativeSelect
          id={`${idPrefix}-country`}
          aria-label={t("country")}
          className="w-full"
          value={address.country_iso}
          onChange={(e) => onChange("country_iso", e.target.value)}
          required
        >
          <NativeSelectOption value="" disabled>
            {t("selectCountry")}
          </NativeSelectOption>
          {countries.map((country) => (
            <NativeSelectOption key={country.iso} value={country.iso}>
              {country.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <FieldGroup className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-first_name`} className="sr-only">
            {t("firstName")}
          </FieldLabel>
          <Input
            type="text"
            id={`${idPrefix}-first_name`}
            aria-label={t("firstName")}
            value={address.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
            placeholder={t("firstName")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-last_name`} className="sr-only">
            {t("lastName")}
          </FieldLabel>
          <Input
            type="text"
            id={`${idPrefix}-last_name`}
            aria-label={t("lastName")}
            required
            value={address.last_name}
            onChange={(e) => onChange("last_name", e.target.value)}
            placeholder={t("lastName")}
          />
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-company`} className="sr-only">
          {t("company")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-company`}
          aria-label={t("company")}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
          placeholder={t("company")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-address1`} className="sr-only">
          {t("address")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address1`}
          aria-label={t("address")}
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          placeholder={t("address")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-address2`} className="sr-only">
          {t("apartment")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address2`}
          aria-label={t("apartment")}
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
          placeholder={t("apartment")}
        />
      </Field>

      <FieldGroup className="grid grid-cols-3 gap-3">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-city`} className="sr-only">
            {t("city")}
          </FieldLabel>
          <Input
            type="text"
            id={`${idPrefix}-city`}
            aria-label={t("city")}
            required
            value={address.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder={t("city")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-state`} className="sr-only">
            {t("stateProvince")}
          </FieldLabel>
          {loadingStates ? (
            <NativeSelect
              id={`${idPrefix}-state`}
              aria-label={t("stateProvince")}
              className="w-full"
              disabled
            >
              <NativeSelectOption value="">{tc("loading")}</NativeSelectOption>
            </NativeSelect>
          ) : hasStates ? (
            <NativeSelect
              id={`${idPrefix}-state`}
              aria-label={t("stateProvince")}
              className="w-full"
              value={address.state_abbr}
              onChange={(e) => onChange("state_abbr", e.target.value)}
              required
            >
              <NativeSelectOption value="" disabled>
                {t("selectState")}
              </NativeSelectOption>
              {states.map((state) => (
                <NativeSelectOption key={state.abbr} value={state.abbr}>
                  {state.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : (
            <Input
              type="text"
              id={`${idPrefix}-state`}
              aria-label={t("stateProvince")}
              value={address.state_name}
              onChange={(e) => onChange("state_name", e.target.value)}
              placeholder={t("stateProvince")}
            />
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-postal_code`} className="sr-only">
            {t("zipCode")}
          </FieldLabel>
          <Input
            type="text"
            id={`${idPrefix}-postal_code`}
            aria-label={t("zipCode")}
            required
            value={address.postal_code}
            onChange={(e) => onChange("postal_code", e.target.value)}
            placeholder={t("zipCode")}
          />
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-phone`} className="sr-only">
          {t("phone")}
        </FieldLabel>
        <Input
          type="tel"
          id={`${idPrefix}-phone`}
          aria-label={t("phone")}
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder={t("phone")}
        />
      </Field>
    </FieldGroup>
  );
}
