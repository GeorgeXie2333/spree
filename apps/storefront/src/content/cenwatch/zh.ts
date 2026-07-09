import type { CenwatchContent } from "./types";

export const zh: CenwatchContent = {
  brand: {
    name: "CenWatch",
    tagline: "面向所有屏幕的隔空触控腕带",
    description:
      "CenWatch 是一款 Air Touch 手表，可将精准手指动作转化为对附近屏幕和设备的远程控制。",
    supportEmail: "hello@cenwatch.com",
  },
  navigation: [
    { label: "首页", href: "/" },
    { label: "产品目录", href: "/products" },
    { label: "操作说明", href: "/operation-instructions" },
    { label: "联系方式", href: "/contact" },
    { label: "订单追踪", href: "/order-tracking" },
  ],
  hero: {
    eyebrow: "Air Touch 隔空控制",
    title: "用空气中的手势，控制每一块屏幕。",
    subtitle:
      "CenWatch 将手指动作变成远程触控，让平板、电脑、智能空间和 AR 眼镜拥有新的免触摸控制方式。",
    primaryCta: "选购 CenWatch",
    secondaryCta: "查看手势说明",
    image: "/cenwatch/hero.webp",
    stats: [
      { value: "295 ft", label: "蓝牙控制距离" },
      { value: "全屏幕", label: "点击、滚动、滑动、返回" },
      { value: "5 系统", label: "Android、iOS、Windows、macOS、Linux" },
      { value: "Spree", label: "价格、型号和库存以结账实时数据为准" },
    ],
  },
  sections: {
    intro: {
      eyebrow: "认识 CenWatch",
      title: "一种新的设备控制方式",
      text: "佩戴手表，通过蓝牙连接，即可控制演示、应用、房间设备和媒体内容，不必一直守在鼠标或触摸屏旁边。",
      image: "/cenwatch/distance.webp",
    },
    features: {
      eyebrow: "适合各种任务",
      title: "点击、滑动、滚动、返回，都由自然手势完成。",
      text: "CenWatch 围绕短促、明确、易练习的动作设计，适合办公、学习和娱乐等场景。",
      items: [
        {
          title: "远程触控",
          text: "不用触摸屏幕，也能移动光标并完成点击。",
        },
        {
          title: "LiDAR 手势平面",
          text: "LiDAR 模块建立检测平面，精准追踪手指运动。",
        },
        {
          title: "演示控制",
          text: "切换幻灯片、强调重点，让观众注意力留在演讲者身上。",
        },
        {
          title: "适配 AR 交互",
          text: "为 AR 眼镜提供更实用、更克制的控制方式。",
        },
        {
          title: "长按与拖动",
          text: "双指向下点击可触发长按、图标移动和手写等操作。",
        },
        {
          title: "智能家居",
          text: "用安静、可穿戴的界面控制身边设备。",
        },
      ],
    },
    scenes: {
      eyebrow: "控制你的世界",
      title: "为房间、屏幕和空间设备而生。",
      items: [
        {
          title: "课堂 / 会议室",
          text: "离开屏幕也能流畅演示，让发言更自然、更有掌控感。",
        },
        {
          title: "AR 眼镜",
          text: "AR 场景更需要小而准确的动作，而不是大幅挥手。",
        },
        {
          title: "智能家居",
          text: "用更自然的方式控制附近电器、电视和大屏。",
        },
      ],
    },
    tech: {
      eyebrow: "CenWatch 背后的技术",
      title: "指尖上的 LiDAR 精度。",
      text: "佩戴时让 LiDAR 一侧朝向手指，CenWatch 会在检测平面内捕捉动作，并转换为光标和触控操作。",
      image: "/cenwatch/lidar.gif",
      points: [
        {
          title: "肘部旋转",
          text: "通过前臂绕肘部旋转移动光标，而不是整只手臂平移。",
        },
        {
          title: "手指分离",
          text: "手指自然弯曲并略微分开，有助于稳定识别。",
        },
        {
          title: "向下点击",
          text: "像敲键盘一样向下点击，而不是向前戳触摸屏。",
        },
      ],
    },
    compatibility: {
      eyebrow: "开箱即用",
      title: "连接一次，到处可控。",
      text: "CenWatch 通过蓝牙支持 Android、iOS、Windows、macOS、Linux、智能电视、智能家居以及 AR/VR 显示设备。",
      image: "/cenwatch/devices.webp",
      platforms: [
        "Android",
        "iOS",
        "Windows",
        "macOS",
        "Linux",
        "智能电视",
        "智能家居",
        "AR / VR",
      ],
    },
    comparison: {
      eyebrow: "为什么选择隔空触控",
      title: "鼠标、触屏、遥控器之外的可穿戴控制层。",
      columns: {
        mode: "方式",
        cenwatch: "CenWatch",
        traditional: "传统控制",
      },
      rows: [
        {
          label: "距离",
          cenwatch: "通过蓝牙在房间内远程控制屏幕。",
          traditional: "触摸屏和鼠标通常要求你靠近设备。",
        },
        {
          label: "动作",
          cenwatch: "小幅手指动作配合肘部旋转即可操作。",
          traditional: "常需要大幅挥手，或走回屏幕旁边。",
        },
        {
          label: "空间场景",
          cenwatch: "适合 AR 眼镜、大屏和会议空间。",
          traditional: "遥控器和触控板常常需要频繁切换模式。",
        },
      ],
    },
    specs: {
      eyebrow: "核心规格",
      title: "为日常控制而设计。",
      items: [
        { label: "控制方式", value: "LiDAR 手势检测平面" },
        { label: "连接方式", value: "蓝牙" },
        { label: "控制距离", value: "合适条件下最高约 295 ft" },
        { label: "输入动作", value: "移动、点击、滚动、滑动、长按" },
        { label: "适配设备", value: "平板、电脑、大屏、AR 眼镜" },
        { label: "防水", value: "不防水，请避免接触水" },
      ],
    },
    faq: {
      eyebrow: "常见问题",
      title: "购买前你可能想知道。",
      items: [
        {
          question: "CenWatch 会取代触摸屏吗？",
          answer:
            "它增加了一层远程触控方式。需要直接触摸时，你依然可以照常使用设备。",
        },
        {
          question: "需要多久能熟练？",
          answer: "建议预留 15-30 分钟集中练习，让光标移动和点击动作更自然。",
        },
        {
          question: "价格、库存和型号从哪里来？",
          answer:
            "营销页会引导至 Spree 产品目录。实时价格、型号、库存、购物车、结账和订单均来自 Spree。",
        },
      ],
    },
    cta: {
      title: "把隔空触控带到你的日常屏幕。",
      text: "选择 CenWatch 型号，并通过 Spree 商店安全结账。",
      button: "选购系列产品",
    },
  },
  products: [
    {
      name: "CenWatch Active-1 1.83'' 智能手表",
      image: "/cenwatch/active-1.jpg",
      summary: "支持隔空手势控制、蓝牙通话和短信，兼容 Android 与 iPhone。",
    },
    {
      name: "CenWatch Active-2 1.83'' 智能手表",
      image: "/cenwatch/active-2.jpg",
      summary: "面向远程控制、通话、消息和日常屏幕交互的 Air Touch 手表。",
    },
    {
      name: "CenWatch Active-3 1.83'' 智能手表",
      image: "/cenwatch/active-3.jpg",
      summary: "适合手机、平板、电脑、课堂和会议室的远程触控设备。",
    },
  ],
  instructions: {
    title: "操作说明",
    intro:
      "CenWatch 可通过蓝牙控制附近屏幕，支持 Android、iOS、Windows、macOS 和 Linux。目前 iPad、Android 平板和 Android 大屏的适配效果最佳。",
    sections: [
      {
        title: "1. 设备连接",
        body: [
          "打开 CenWatch 和目标设备的蓝牙，在系统蓝牙界面完成连接。",
          "首次连接可能需要验证码；连接成功后，设备会出现在已连接或已保存设备列表中。",
          "打开 CenWatch App，点击加号，选择目标设备。目标屏幕出现光标后即可开始控制。",
        ],
      },
      {
        title: "2. 使用方法",
        body: [
          "建议进行 15-30 分钟的刻意练习，让远程触控更精准高效。",
          "移动光标依靠肘部旋转，手指自然分开，点击时像敲键盘一样向下。",
          "快速左右或上下移动光标可实现滑动；快速旋转一次返回，支持的设备上快速两次可回到桌面。",
          "双指向下点击可触发长按。手腕下垂可暂停控制，抬起手腕可重新激活。",
        ],
      },
      {
        title: "3. 注意事项",
        body: [
          "CenWatch 不防水，请避免接触水。",
          "佩戴时务必让 LiDAR 一侧朝向手指。",
          "如果蓝牙列表无法刷新目标设备，可重启蓝牙，并保持目标设备处于连接界面。",
          "开机后可能短暂无法触控，等待 1-3 分钟通常会恢复正常。",
        ],
      },
    ],
  },
  contact: {
    title: "联系 CenWatch",
    text: "如有产品、订单、支持或合作问题，请发送消息给 CenWatch 团队。",
    fields: {
      name: "姓名",
      email: "电子邮箱",
      phone: "电话号码",
      message: "留言",
    },
    submit: "发送消息",
    success: "谢谢，你的消息已准备发送。",
    emailFallback: "你也可以通过 hello@cenwatch.com 联系我们。",
  },
  tracking: {
    title: "订单追踪",
    text: "请输入结账时使用的订单号和邮箱。只有两者匹配时才会显示物流详情。",
    orderNumber: "订单号",
    email: "电子邮箱",
    submit: "查询状态",
    helper: "如果订单尚未发货，状态页会显示最新订单状态，而不是物流单号。",
    loading: "查询中...",
    resultHeading: "追踪结果",
    genericFailure: "未找到与这些信息匹配的订单。",
    unavailable: "订单追踪暂时不可用。",
  },
  footer: {
    blurb: "CenWatch 是面向屏幕、空间、智能设备和 AR 体验的 Air Touch 手表。",
    newsletterTitle: "订阅更新",
    newsletterText: "获取 CenWatch 产品更新、供货信息和发布动态。",
  },
};
