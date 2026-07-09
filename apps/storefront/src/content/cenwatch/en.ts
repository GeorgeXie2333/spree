import type { CenwatchContent } from "./types";

export const en: CenwatchContent = {
  brand: {
    name: "CenWatch",
    tagline: "The Telekinesis Band for All Screens",
    description:
      "CenWatch is an air touch watch that turns precise finger gestures into remote control for nearby screens and devices.",
    supportEmail: "hello@cenwatch.com",
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "Product Catalog", href: "/products" },
    { label: "Operation instructions", href: "/operation-instructions" },
    { label: "Contact", href: "/contact" },
    { label: "Order Tracking", href: "/order-tracking" },
  ],
  hero: {
    eyebrow: "Air Touch Control",
    title: "Control every screen from the air.",
    subtitle:
      "CenWatch turns finger movement into remote touch, giving tablets, computers, smart rooms, and AR glasses a new kind of hands-free control.",
    primaryCta: "Shop CenWatch",
    secondaryCta: "Learn gestures",
    image: "/cenwatch/hero.webp",
    stats: [
      { value: "295 ft", label: "Bluetooth control range" },
      { value: "All screens", label: "Touch, scroll, swipe, click" },
      { value: "5 OS", label: "Android, iOS, Windows, macOS, Linux" },
      { value: "Spree", label: "Live price, variants, and stock at checkout" },
    ],
  },
  sections: {
    intro: {
      eyebrow: "Introducing CenWatch",
      title: "A new way to control your devices",
      text: "Wear the band, connect by Bluetooth, and move through presentations, apps, rooms, and media without staying glued to a mouse or touchscreen.",
      image: "/cenwatch/distance.webp",
    },
    features: {
      eyebrow: "For all your tasks",
      title: "Tap, swipe, scroll, and return with natural gestures.",
      text: "CenWatch is designed around short, deliberate movements that are easy to practice and subtle enough for work, learning, and entertainment.",
      items: [
        {
          title: "Remote touch",
          text: "Move a cursor and click from a distance without touching the screen.",
        },
        {
          title: "LiDAR gesture plane",
          text: "A LiDAR module creates a detection plane that tracks finger motion precisely.",
        },
        {
          title: "Presentation control",
          text: "Advance slides, highlight ideas, and keep attention on the speaker.",
        },
        {
          title: "AR-ready interaction",
          text: "Give AR glasses a practical control layer without waving at the display.",
        },
        {
          title: "Long press and drag",
          text: "Use two-finger downward gestures for long press, icon movement, and handwriting.",
        },
        {
          title: "Smart home",
          text: "Control the devices around you with a quiet, wearable interface.",
        },
      ],
    },
    scenes: {
      eyebrow: "Control your world",
      title: "Built for rooms, screens, and spatial devices.",
      items: [
        {
          title: "Classroom / Meeting Room",
          text: "Make speeches feel fluid and a little magical while staying away from the screen.",
        },
        {
          title: "AR Glasses",
          text: "A practical companion for AR glasses, where small gestures matter more than big movements.",
        },
        {
          title: "Smart Home",
          text: "A more natural way to control nearby appliances, TVs, and large screens.",
        },
      ],
    },
    tech: {
      eyebrow: "The tech behind CenWatch",
      title: "LiDAR precision at your fingertips.",
      text: "CenWatch faces the LiDAR side toward your fingers, detects movement in a controlled plane, and converts motion into cursor and touch actions.",
      image: "/cenwatch/lidar.gif",
      points: [
        {
          title: "Elbow rotation",
          text: "Move the cursor by rotating the forearm around the elbow instead of pushing the whole arm forward.",
        },
        {
          title: "Finger separation",
          text: "Keep fingers naturally curved and slightly apart for stable detection.",
        },
        {
          title: "Downward click",
          text: "Click down like typing on a keyboard rather than poking forward at a touchscreen.",
        },
      ],
    },
    compatibility: {
      eyebrow: "Use right out of the box",
      title: "Connect once. Control everywhere.",
      text: "CenWatch works through Bluetooth with Android, iOS, Windows, macOS, Linux, smart TVs, smart home devices, and AR/VR displays.",
      image: "/cenwatch/devices.webp",
      platforms: [
        "Android",
        "iOS",
        "Windows",
        "macOS",
        "Linux",
        "Smart TVs",
        "Smart home",
        "AR / VR",
      ],
    },
    comparison: {
      eyebrow: "Why air touch",
      title: "A wearable control layer beside mouse, touch, and remotes.",
      columns: {
        mode: "Mode",
        cenwatch: "CenWatch",
        traditional: "Traditional control",
      },
      rows: [
        {
          label: "Distance",
          cenwatch: "Control screens across a room over Bluetooth.",
          traditional: "Touchscreens and mice keep you near the device.",
        },
        {
          label: "Movement",
          cenwatch: "Small finger motions and elbow rotation.",
          traditional: "Large arm gestures or walking back to the screen.",
        },
        {
          label: "Spatial use",
          cenwatch: "Works naturally with AR glasses and large displays.",
          traditional: "Remotes and touchpads are often mode-heavy.",
        },
      ],
    },
    specs: {
      eyebrow: "Core specs",
      title: "Designed as a practical everyday controller.",
      items: [
        { label: "Control method", value: "LiDAR gesture detection plane" },
        { label: "Connection", value: "Bluetooth" },
        {
          label: "Control range",
          value: "Up to 295 ft in suitable conditions",
        },
        {
          label: "Input actions",
          value: "Move, click, scroll, swipe, long press",
        },
        {
          label: "Best-fit devices",
          value: "Tablets, PCs, large screens, AR glasses",
        },
        {
          label: "Water resistance",
          value: "Not waterproof; avoid water contact",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Common questions before you buy.",
      items: [
        {
          question: "Does CenWatch replace the touchscreen?",
          answer:
            "It adds a remote touch layer. You can still use the device normally whenever direct touch is better.",
        },
        {
          question: "How long does it take to learn?",
          answer:
            "Most users should plan on 15-30 minutes of focused practice to make cursor movement and clicks feel natural.",
        },
        {
          question: "Where do price, stock, and variants come from?",
          answer:
            "The marketing page links into the Spree catalog. Live price, variants, availability, cart, checkout, and orders come from Spree.",
        },
      ],
    },
    cta: {
      title: "Bring air touch control to your everyday screens.",
      text: "Choose your CenWatch model and check out securely through the Spree storefront.",
      button: "Shop the collection",
    },
  },
  products: [
    {
      name: "CenWatch Active-1 1.83'' Smartwatch",
      image: "/cenwatch/active-1.jpg",
      summary:
        "Air gesture control, Bluetooth calls and SMS, compatible with Android and iPhone.",
    },
    {
      name: "CenWatch Active-2 1.83'' Smartwatch",
      image: "/cenwatch/active-2.jpg",
      summary:
        "A refined air touch watch for remote control, calling, messaging, and daily screen interaction.",
    },
    {
      name: "CenWatch Active-3 1.83'' Smartwatch",
      image: "/cenwatch/active-3.jpg",
      summary:
        "Remote touch control for phones, tablets, computers, classrooms, and conference rooms.",
    },
  ],
  instructions: {
    title: "Operation instructions",
    intro:
      "CenWatch can control nearby screens through Bluetooth. It supports Android, iOS, Windows, macOS, and Linux, with best current adaptation on iPad, Android tablets, and Android large screens.",
    sections: [
      {
        title: "1. Equipment connection",
        body: [
          "Turn on Bluetooth for CenWatch and the target device, then connect from the system Bluetooth screen.",
          "On first connection, the device may ask for a verification code. After successful pairing, it appears in the connected or saved device list.",
          "Open the CenWatch app, tap the plus button, and choose the target device. A cursor appearing on the target screen means control is ready.",
        ],
      },
      {
        title: "2. Usage method",
        body: [
          "Practice for 15-30 minutes to make remote touch feel precise and efficient.",
          "Use elbow rotation for cursor movement, keep fingers naturally separated, and click downward like typing.",
          "Move the cursor quickly left/right or up/down to slide. Rotate quickly once to return, or twice to return to the home screen on supported devices.",
          "Use a two-finger downward click for long press. Lower the wrist to pause control and lift it to reactivate.",
        ],
      },
      {
        title: "3. Precautions",
        body: [
          "CenWatch is not waterproof. Avoid water contact.",
          "Wear the watch with the LiDAR side facing your fingers.",
          "If Bluetooth devices do not refresh, restart Bluetooth and keep the target device on the connection screen.",
          "After startup, touch control can briefly fail for 1-3 minutes before returning to normal.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact CenWatch",
    text: "Send a message to the CenWatch team for product, order, support, or partnership questions.",
    fields: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      message: "Message",
    },
    submit: "Send message",
    success: "Thanks. Your message is ready to send.",
    emailFallback: "You can also reach us at hello@cenwatch.com.",
  },
  tracking: {
    title: "Order tracking",
    text: "Enter the order number and email used at checkout. Tracking details are only shown when both match.",
    orderNumber: "Order number",
    email: "Email",
    submit: "Check status",
    helper:
      "If your order has not shipped yet, the status page will show the latest order state instead of a tracking number.",
    loading: "Checking...",
    resultHeading: "Tracking result",
    genericFailure: "We could not find an order matching those details.",
    unavailable: "Order tracking is temporarily unavailable.",
  },
  footer: {
    blurb:
      "CenWatch is an air touch watch for screens, rooms, smart devices, and AR experiences.",
    newsletterTitle: "Stay in the loop",
    newsletterText:
      "Get CenWatch product updates, availability notes, and launch news.",
  },
};
