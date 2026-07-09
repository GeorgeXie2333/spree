import type { SupportedLocale } from "@/lib/i18n/routing";

export type CenwatchLocale = SupportedLocale;

export interface CenwatchLink {
  label: string;
  href: string;
}

export interface CenwatchStat {
  value: string;
  label: string;
}

export interface CenwatchFeature {
  title: string;
  text: string;
}

export interface CenwatchProductSummary {
  name: string;
  image: string;
  summary: string;
}

export interface CenwatchInstructionSection {
  title: string;
  body: string[];
}

export interface CenwatchComparisonRow {
  label: string;
  cenwatch: string;
  traditional: string;
}

export interface CenwatchSpec {
  label: string;
  value: string;
}

export interface CenwatchFaq {
  question: string;
  answer: string;
}

export interface CenwatchContent {
  brand: {
    name: string;
    tagline: string;
    description: string;
    supportEmail: string;
  };
  navigation: CenwatchLink[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    image: string;
    stats: CenwatchStat[];
  };
  sections: {
    intro: {
      eyebrow: string;
      title: string;
      text: string;
      image: string;
    };
    features: {
      eyebrow: string;
      title: string;
      text: string;
      items: CenwatchFeature[];
    };
    scenes: {
      eyebrow: string;
      title: string;
      items: CenwatchFeature[];
    };
    tech: {
      eyebrow: string;
      title: string;
      text: string;
      image: string;
      points: CenwatchFeature[];
    };
    compatibility: {
      eyebrow: string;
      title: string;
      text: string;
      image: string;
      platforms: string[];
    };
    comparison: {
      eyebrow: string;
      title: string;
      columns: {
        mode: string;
        cenwatch: string;
        traditional: string;
      };
      rows: CenwatchComparisonRow[];
    };
    specs: {
      eyebrow: string;
      title: string;
      items: CenwatchSpec[];
    };
    faq: {
      eyebrow: string;
      title: string;
      items: CenwatchFaq[];
    };
    cta: {
      title: string;
      text: string;
      button: string;
    };
  };
  products: CenwatchProductSummary[];
  instructions: {
    title: string;
    intro: string;
    sections: CenwatchInstructionSection[];
  };
  contact: {
    title: string;
    text: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      message: string;
    };
    submit: string;
    success: string;
    emailFallback: string;
  };
  tracking: {
    title: string;
    text: string;
    orderNumber: string;
    email: string;
    submit: string;
    helper: string;
    loading: string;
    resultHeading: string;
    genericFailure: string;
    unavailable: string;
  };
  footer: {
    blurb: string;
    newsletterTitle: string;
    newsletterText: string;
  };
}
