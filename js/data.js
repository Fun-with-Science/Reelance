/* =============================================
   REELANCE — DATA.JS
   All dynamic content/data
   ============================================= */

const REELANCE_DATA = {

  categories: [
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>`,
      name: "Video Editing",
      filter: "Video Editor",
      count: "2,140"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`,
      name: "2D / 3D Animation",
      filter: "Animation",
      count: "1,090"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>`,
      name: "Motion Graphics",
      filter: "Motion Graphics",
      count: "880"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 2.5 5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z"/></svg>`,
      name: "VFX & Compositing",
      filter: "VFX",
      count: "320"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><path d="M12 22a10 10 0 1 1 0-20"/></svg>`,
      name: "Color Grading",
      filter: "Colorist",
      count: "410"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
      name: "Thumbnail Design",
      filter: "Thumbnail",
      count: "740"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 10v4M6 6v12M10 3v18M14 7v10M18 5v14M22 9v6"/></svg>`,
      name: "Sound & Mixing",
      filter: "Sound",
      count: "260"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
      name: "Digital Marketing",
      filter: "Marketing",
      count: "1,450"
    },
    {
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>`,
      name: "See everything",
      filter: "All",
      count: "5,840"
    }
  ],

  creators: [
    {
      id: 1,
      name: "Aarav Mehta",
      role: "YouTube Video Editor",
      cat: "Video Editor",
      loc: "local",
      city: "Mumbai, IN",
      rate: "₹1,200",
      per: "/hr",
      rating: "4.9",
      reviews: 128,
      grad: ["#FF7B3D", "#ff9d57"],
      verified: true,
      bio: "5+ years crafting long-form YouTube content for 500k+ channels. Specializing in storytelling, pacing, and audience retention.",
      skills: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Color Grading", "Pacing"],
      portfolio: ["youtube.com/example1", "youtube.com/example2"],
      responseTime: "< 2 hrs",
      completedJobs: 247
    },
    {
      id: 2,
      name: "Lena Brooks",
      role: "Motion Designer",
      cat: "Motion Graphics",
      loc: "remote",
      city: "Remote",
      rate: "$45",
      per: "/hr",
      rating: "4.8",
      reviews: 94,
      grad: ["#34E0CC", "#5fe9d9"],
      verified: true,
      bio: "Award-winning motion designer with expertise in brand identities, explainers, and broadcast graphics for global clients.",
      skills: ["After Effects", "Cinema 4D", "Illustrator", "Figma", "Lottie"],
      portfolio: [],
      responseTime: "< 4 hrs",
      completedJobs: 183
    },
    {
      id: 3,
      name: "Rohan Das",
      role: "VFX & Compositing",
      cat: "VFX",
      loc: "remote",
      city: "Bengaluru, IN",
      rate: "₹1,600",
      per: "/hr",
      rating: "4.9",
      reviews: 76,
      grad: ["#FF7B3D", "#ff6b2c"],
      verified: true,
      bio: "Senior VFX compositor with 8 years in film and digital content. Greenscreen, CGI integration, and particle simulations.",
      skills: ["Nuke", "After Effects", "Blender", "Houdini", "Maya"],
      portfolio: [],
      responseTime: "< 6 hrs",
      completedJobs: 142
    },
    {
      id: 4,
      name: "Sofia Marín",
      role: "2D Animator",
      cat: "Animation",
      loc: "remote",
      city: "Remote",
      rate: "$38",
      per: "/hr",
      rating: "5.0",
      reviews: 211,
      grad: ["#34E0CC", "#2fd8c4"],
      verified: true,
      bio: "Character animator and illustrator specializing in 2D frame-by-frame and rigged animation for digital media.",
      skills: ["Adobe Animate", "Procreate", "After Effects", "Storyboarding", "Illustration"],
      portfolio: [],
      responseTime: "< 3 hrs",
      completedJobs: 319
    },
    {
      id: 5,
      name: "Karan Singh",
      role: "Colorist · DaVinci",
      cat: "Colorist",
      loc: "local",
      city: "Delhi, IN",
      rate: "₹1,400",
      per: "/hr",
      rating: "4.7",
      reviews: 58,
      grad: ["#ff9d57", "#FF7B3D"],
      verified: false,
      bio: "Certified DaVinci Resolve colorist. From broadcast TV to indie films — I craft the final look that makes your footage shine.",
      skills: ["DaVinci Resolve", "Lumetri", "HDR", "SDR", "Film Look"],
      portfolio: [],
      responseTime: "< 8 hrs",
      completedJobs: 87
    },
    {
      id: 6,
      name: "Mia Chen",
      role: "Thumbnail Designer",
      cat: "Thumbnail",
      loc: "remote",
      city: "Remote",
      rate: "$25",
      per: "/thumb",
      rating: "4.9",
      reviews: 304,
      grad: ["#5fe9d9", "#34E0CC"],
      verified: true,
      bio: "Thumbnail specialist for YouTube creators. I've helped channels grow from 10k to 1M+ views with click-worthy designs.",
      skills: ["Photoshop", "Figma", "Canva Pro", "Typography", "A/B Testing"],
      portfolio: [],
      responseTime: "< 1 hr",
      completedJobs: 892
    },
    {
      id: 7,
      name: "Devansh Roy",
      role: "Reels & Shorts Editor",
      cat: "Video Editor",
      loc: "local",
      city: "Guwahati, IN",
      rate: "₹800",
      per: "/reel",
      rating: "4.8",
      reviews: 167,
      grad: ["#FF7B3D", "#ff9d57"],
      verified: true,
      bio: "Short-form content specialist with 400+ reels edited. Expert at viral hooks, trending audio, and algorithm-friendly cuts.",
      skills: ["CapCut", "Premiere Pro", "Instagram Reels", "TikTok", "Trending Audio"],
      portfolio: [],
      responseTime: "< 2 hrs",
      completedJobs: 423
    },
    {
      id: 8,
      name: "Tariq Khan",
      role: "Sound Designer",
      cat: "Sound",
      loc: "remote",
      city: "Remote",
      rate: "$30",
      per: "/hr",
      rating: "4.8",
      reviews: 89,
      grad: ["#34E0CC", "#5fe9d9"],
      verified: true,
      bio: "Audio post-production specialist covering music sync, sound design, dialogue cleanup, and podcast mastering.",
      skills: ["Pro Tools", "Logic Pro", "Audition", "iZotope RX", "Music Licensing"],
      portfolio: [],
      responseTime: "< 4 hrs",
      completedJobs: 156
    },
    {
      id: 9,
      name: "Ishita Verma",
      role: "3D Animator · Blender",
      cat: "Animation",
      loc: "remote",
      city: "Pune, IN",
      rate: "₹1,800",
      per: "/hr",
      rating: "4.9",
      reviews: 72,
      grad: ["#5fe9d9", "#34E0CC"],
      verified: true,
      bio: "Blender and Cinema 4D specialist for product visualizations, architectural renders, and stylized 3D animations.",
      skills: ["Blender", "Cinema 4D", "Cycles", "EEVEE", "Rigging"],
      portfolio: [],
      responseTime: "< 6 hrs",
      completedJobs: 104
    },
    {
      id: 10,
      name: "Noah Park",
      role: "Long-form Editor",
      cat: "Video Editor",
      loc: "remote",
      city: "Remote",
      rate: "$50",
      per: "/hr",
      rating: "5.0",
      reviews: 143,
      grad: ["#ff9d57", "#FF7B3D"],
      verified: true,
      bio: "Long-form documentary and podcast video editor. Storytelling-first approach with 10 years of narrative experience.",
      skills: ["Premiere Pro", "DaVinci Resolve", "Avid", "Audio Mixing", "Storytelling"],
      portfolio: [],
      responseTime: "< 3 hrs",
      completedJobs: 268
    },
    {
      id: 11,
      name: "Ananya Iyer",
      role: "Motion Graphics",
      cat: "Motion Graphics",
      loc: "local",
      city: "Bengaluru, IN",
      rate: "₹1,300",
      per: "/hr",
      rating: "4.8",
      reviews: 91,
      grad: ["#34E0CC", "#2fd8c4"],
      verified: false,
      bio: "Motion designer for startups and agencies. From logo animations to full brand kits — fast turnaround, premium quality.",
      skills: ["After Effects", "Lottie", "SVG Animation", "Figma", "Brand Identity"],
      portfolio: [],
      responseTime: "< 4 hrs",
      completedJobs: 178
    },
    {
      id: 12,
      name: "Marco Rossi",
      role: "Color Grade · Film",
      cat: "Colorist",
      loc: "remote",
      city: "Remote",
      rate: "$55",
      per: "/hr",
      rating: "4.9",
      reviews: 62,
      grad: ["#FF7B3D", "#ff6b2c"],
      verified: true,
      bio: "Film colorist and LUT designer. Cinematic looks for narrative films, music videos, and brand commercials.",
      skills: ["DaVinci Resolve", "Custom LUTs", "Film Emulation", "HDR10", "Dolby Vision"],
      portfolio: [],
      responseTime: "< 5 hrs",
      completedJobs: 94
    }
  ],

  steps: [
    {
      num: "STEP 01",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/></svg>`,
      title: "Log in — it's free",
      desc: "Sign up in seconds as a client or a creator. Login is required so every profile and message is verified and real."
    },
    {
      num: "STEP 02",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
      title: "Search the talent",
      desc: "Filter by craft and by remote or near-me. Browse verified portfolios, ratings, and rates until you find the right fit."
    },
    {
      num: "STEP 03",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      title: "Connect directly",
      desc: "Message creators yourself and kick off the project on your terms. No commissions, no agent in the middle."
    }
  ],

  testimonials: [
    {
      quote: "Found an amazing video editor in under 10 minutes. The quality blew our entire production team away — and it cost us nothing to connect.",
      author: "Priya Nair",
      role: "Content Director @ Growthly",
      rating: 5,
      grad: ["#FF7B3D", "#ff9d57"]
    },
    {
      quote: "As a freelance animator, Reelance has completely replaced my cold outreach. I get 3-4 serious inquiries a week, all inbound.",
      author: "James Whitfield",
      role: "2D Animator · Creator",
      rating: 5,
      grad: ["#34E0CC", "#5fe9d9"]
    },
    {
      quote: "The filtering is insane. Needed a colorist who could work on film noir style — found exactly that in 5 minutes. No fees taken.",
      author: "Ritika Sharma",
      role: "Independent Film Director",
      rating: 5,
      grad: ["#ff9d57", "#FF7B3D"]
    },
    {
      quote: "I've tried Upwork, Fiverr, and others. Reelance is the only one where I talk directly to the client. The quality of projects is just different.",
      author: "Diego Fuentes",
      role: "Motion GFX Designer · Creator",
      rating: 5,
      grad: ["#2fd8c4", "#34E0CC"]
    },
    {
      quote: "My YouTube channel went from 40k to 280k in 8 months after I found my editor here. Direct communication was the game changer.",
      author: "Sam Okoro",
      role: "Tech YouTuber · @SamBuilds",
      rating: 5,
      grad: ["#FF7B3D", "#ff6b2c"]
    },
    {
      quote: "The lock-until-login feature felt annoying at first, but once I signed up (30 seconds) I realized why — every creator profile is real and verified.",
      author: "Kezia Thomas",
      role: "Marketing Lead @ Orbis Media",
      rating: 5,
      grad: ["#5fe9d9", "#34E0CC"]
    }
  ],

  pricing: [
    {
      name: "Free",
      price: "₹0",
      priceSub: "forever, no card needed",
      featured: false,
      features: [
        { text: "Browse all creator profiles", on: true },
        { text: "Send up to 5 messages/month", on: true },
        { text: "Filter by category & location", on: true },
        { text: "View ratings & reviews", on: true },
        { text: "Priority search listing", on: false },
        { text: "Unlimited messages", on: false },
        { text: "Project collaboration tools", on: false }
      ],
      cta: "Get started free",
      ctaRole: "client"
    },
    {
      name: "Pro",
      price: "₹799",
      priceSub: "per month · billed monthly",
      featured: true,
      badge: "Most Popular",
      features: [
        { text: "Everything in Free", on: true },
        { text: "Unlimited messages", on: true },
        { text: "Priority search placement", on: true },
        { text: "Project collaboration board", on: true },
        { text: "Analytics dashboard", on: true },
        { text: "Verified badge on profile", on: true },
        { text: "Featured creator spotlight", on: false }
      ],
      cta: "Start Pro — free trial",
      ctaRole: "creator"
    },
    {
      name: "Studio",
      price: "₹2,499",
      priceSub: "per month · up to 5 seats",
      featured: false,
      features: [
        { text: "Everything in Pro", on: true },
        { text: "5 team member seats", on: true },
        { text: "Featured creator spotlight", on: true },
        { text: "Dedicated account manager", on: true },
        { text: "Custom portfolio page", on: true },
        { text: "API access", on: true },
        { text: "White-label options", on: true }
      ],
      cta: "Contact us",
      ctaRole: "client"
    }
  ]
};

window.REELANCE_DATA = REELANCE_DATA;
