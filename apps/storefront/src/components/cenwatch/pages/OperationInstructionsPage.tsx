import type { CenwatchContent } from "@/content/cenwatch";

interface OperationInstructionsPageProps {
  content: CenwatchContent;
}

export function OperationInstructionsPage({
  content,
}: OperationInstructionsPageProps) {
  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
            {content.brand.name}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal sm:text-5xl">
            {content.instructions.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-300 sm:text-lg">
            {content.instructions.intro}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {content.instructions.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-neutral-950">
                {section.title}
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-6 text-neutral-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
