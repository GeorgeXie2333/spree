import type { CenwatchContent } from "@/content/cenwatch";

interface ContactPageProps {
  content: CenwatchContent;
}

export function ContactPage({ content }: ContactPageProps) {
  return (
    <div className="bg-white">
      <section className="container mx-auto grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-600">
            {content.brand.name}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
            {content.contact.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-neutral-700">
            {content.contact.text}
          </p>
          <p className="mt-5 text-sm text-neutral-600">
            {content.contact.emailFallback}
          </p>
        </div>

        <form
          aria-label={content.contact.title}
          action={`mailto:${content.brand.supportEmail}`}
          method="post"
          encType="text/plain"
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-neutral-800">
              {content.contact.fields.name}
              <input
                name="name"
                className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-800">
              {content.contact.fields.email}
              <input
                name="email"
                type="email"
                required
                className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-800 sm:col-span-2">
              {content.contact.fields.phone}
              <input
                name="phone"
                type="tel"
                className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-neutral-800 sm:col-span-2">
              {content.contact.fields.message}
              <textarea
                name="message"
                required
                rows={6}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-neutral-950"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 h-11 rounded-md bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            {content.contact.submit}
          </button>
        </form>
      </section>
    </div>
  );
}
