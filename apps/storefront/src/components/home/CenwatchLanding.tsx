import {
  ArrowRightIcon,
  BluetoothIcon,
  Move3DIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CenwatchContent } from "@/content/cenwatch";

interface CenwatchLandingProps {
  basePath: string;
  content: CenwatchContent;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-normal text-primary-600">
      {children}
    </p>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
  light = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={
          light
            ? "text-3xl font-semibold text-white"
            : "text-3xl font-semibold text-foreground"
        }
      >
        {title}
      </h2>
      {text ? (
        <p
          className={
            light
              ? "max-w-2xl text-base leading-7 text-white/72"
              : "max-w-2xl text-base leading-7 text-muted-foreground"
          }
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function CenwatchLanding({ basePath, content }: CenwatchLandingProps) {
  const shopHref = `${basePath}/products`;
  const instructionsHref = `${basePath}/operation-instructions`;

  return (
    <main className="overflow-hidden bg-background">
      <section className="relative bg-[#0a0f18] text-white">
        <div className="absolute inset-x-0 top-0 h-32 bg-primary-500/20" />
        <div className="container relative mx-auto grid min-h-[760px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <Badge className="w-fit bg-[#d9f66f] text-[#111827] hover:bg-[#d9f66f]">
                {content.hero.eyebrow}
              </Badge>
              <div className="flex flex-col gap-5">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white">
                  {content.hero.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/75">
                  {content.hero.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-auto min-h-13 max-w-full whitespace-normal bg-[#d9f66f] py-3 text-center text-[#111827] hover:bg-[#cbe95d]"
                size="lg"
              >
                <Link href={shopHref}>
                  {content.hero.primaryCta}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-auto min-h-13 max-w-full whitespace-normal border-white/22 bg-white/8 py-3 text-center text-white hover:bg-white/14 hover:text-white"
                size="lg"
                variant="outline"
              >
                <Link href={instructionsHref}>{content.hero.secondaryCta}</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {content.hero.stats.map((stat) => (
                <div
                  className="min-h-28 rounded-lg border border-white/12 bg-white/7 p-4"
                  key={`${stat.value}-${stat.label}`}
                >
                  <p className="text-2xl font-semibold text-[#d9f66f]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/12 bg-white/8 shadow-2xl shadow-black/40 lg:min-h-[620px]">
            <Image
              alt="CenWatch air touch hero"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
              src={content.hero.image}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0f18] via-[#0a0f18]/42 to-transparent p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#111827]">
                  {content.brand.tagline}
                </span>
                <span className="rounded-full bg-[#8ee8ff] px-3 py-1 text-sm font-medium text-[#11202a]">
                  {content.brand.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto grid gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="relative min-h-[340px] overflow-hidden rounded-lg bg-muted">
            <Image
              alt="CenWatch long-range control"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 44vw, 100vw"
              src={content.sections.intro.image}
            />
          </div>
          <div className="flex flex-col justify-center gap-6">
            <Eyebrow>{content.sections.intro.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-semibold text-foreground">
              {content.sections.intro.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {content.sections.intro.text}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#f4f7fb] p-4">
                <Move3DIcon className="mb-3 text-[#0055bb]" />
                <p className="text-sm font-medium text-foreground">
                  Remote cursor
                </p>
              </div>
              <div className="rounded-lg bg-[#fff6d9] p-4">
                <BluetoothIcon className="mb-3 text-[#755100]" />
                <p className="text-sm font-medium text-foreground">
                  Bluetooth ready
                </p>
              </div>
              <div className="rounded-lg bg-[#e9fbf7] p-4">
                <SparklesIcon className="mb-3 text-[#006b5b]" />
                <p className="text-sm font-medium text-foreground">Air touch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f7f2]">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.sections.features.eyebrow}
            text={content.sections.features.text}
            title={content.sections.features.title}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.sections.features.items.map((feature) => (
              <article
                className="min-h-48 rounded-lg border border-[#d8ded5] bg-white p-6"
                key={feature.title}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#101820] text-white">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.sections.scenes.eyebrow}
            light
            title={content.sections.scenes.title}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {content.sections.scenes.items.map((scene, index) => (
              <article
                className="min-h-56 rounded-lg border border-white/12 bg-white/7 p-6"
                key={scene.title}
              >
                <p className="text-sm font-semibold text-[#8ee8ff]">
                  0{index + 1}
                </p>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {scene.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  {scene.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto grid gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center gap-8">
            <SectionHeader
              eyebrow={content.sections.tech.eyebrow}
              text={content.sections.tech.text}
              title={content.sections.tech.title}
            />
            <div className="grid gap-4">
              {content.sections.tech.points.map((point) => (
                <article
                  className="rounded-lg border border-border bg-card p-5"
                  key={point.title}
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {point.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-[#05070a]">
            <Image
              alt="CenWatch LiDAR gesture plane"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
              src={content.sections.tech.image}
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc]">
        <div className="container mx-auto grid gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-white">
            <Image
              alt="CenWatch compatible devices"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={content.sections.compatibility.image}
            />
          </div>
          <div className="flex flex-col justify-center gap-6">
            <Eyebrow>{content.sections.compatibility.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-semibold text-foreground">
              {content.sections.compatibility.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {content.sections.compatibility.text}
            </p>
            <div className="flex flex-wrap gap-2">
              {content.sections.compatibility.platforms.map((platform) => (
                <Badge
                  className="h-auto min-h-8 whitespace-normal rounded-lg border-[#cbd5e1] bg-white px-3 py-1.5 text-[#111827]"
                  key={platform}
                  variant="outline"
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#101820] text-white">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.sections.comparison.eyebrow}
            light
            title={content.sections.comparison.title}
          />
          <div className="overflow-hidden rounded-lg border border-white/12">
            <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-white/10 text-sm font-semibold text-white">
              <div className="p-4">
                {content.sections.comparison.columns.mode}
              </div>
              <div className="p-4">
                {content.sections.comparison.columns.cenwatch}
              </div>
              <div className="p-4">
                {content.sections.comparison.columns.traditional}
              </div>
            </div>
            {content.sections.comparison.rows.map((row) => (
              <div
                className="grid grid-cols-1 border-t border-white/12 text-sm md:grid-cols-[0.8fr_1fr_1fr]"
                key={row.label}
              >
                <div className="bg-white/8 p-4 font-semibold text-[#d9f66f]">
                  {row.label}
                </div>
                <div className="p-4 leading-6 text-white/78">
                  {row.cenwatch}
                </div>
                <div className="p-4 leading-6 text-white/62">
                  {row.traditional}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.sections.specs.eyebrow}
            text={content.brand.description}
            title={content.sections.specs.title}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.sections.specs.items.map((item) => (
              <article
                className="min-h-32 rounded-lg border border-border bg-card p-5"
                key={item.label}
              >
                <h3 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
                  {item.label}
                </h3>
                <p className="mt-3 text-base font-semibold leading-7 text-foreground">
                  {item.value}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.brand.name}
            text={content.brand.description}
            title="Choose your air touch watch."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {content.products.map((product) => (
              <article
                className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-border bg-card"
                key={product.name}
              >
                <div className="relative aspect-square bg-muted">
                  <Image
                    alt={product.name}
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={product.image}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {product.summary}
                  </p>
                  <Link
                    aria-label={`Shop ${product.name}`}
                    className="mt-auto inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                    href={shopHref}
                  >
                    {content.sections.cta.button}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f7f2]">
        <div className="container mx-auto flex flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={content.sections.faq.eyebrow}
            title={content.sections.faq.title}
          />
          <div className="mx-auto grid w-full max-w-4xl gap-3">
            {content.sections.faq.items.map((item) => (
              <details
                className="group rounded-lg border border-[#d8ded5] bg-white p-5"
                key={item.question}
              >
                <summary className="cursor-pointer text-base font-semibold text-foreground">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d9f66f]">
        <div className="container mx-auto flex flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-semibold text-[#111827]">
              {content.sections.cta.title}
            </h2>
            <p className="text-base leading-7 text-[#263238]">
              {content.sections.cta.text}
            </p>
          </div>
          <Button
            asChild
            className="h-auto min-h-13 max-w-full whitespace-normal bg-[#111827] py-3 text-center text-white hover:bg-[#263238]"
            size="lg"
          >
            <Link href={shopHref}>
              {content.sections.cta.button}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
