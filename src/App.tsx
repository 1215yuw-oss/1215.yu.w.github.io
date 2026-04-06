import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Award, 
  Briefcase, 
  User, 
  Code, 
  ChevronRight,
  Globe,
  Instagram,
  Facebook,
  AtSign
} from "lucide-react";
import React, { useRef, useState, createContext, useContext, useEffect } from "react";

// --- Types ---
type Language = "zh" | "en";

interface Translation {
  nav: { label: string; id: string }[];
  hero: { sub: string; title: string; collaborate: string };
  about: { sub: string; title: string; desc: string; design: string; designItems: string; dev: string; devItems: string };
  portfolio: { sub: string; title: string; year: string; viewCase: string };
  quote: { text: string; highlight: string; suffix: string };
  gallery: { sub: string; title: string };
  certs: { sub: string; title: string; stats: { label: string; value: string }[] };
  footer: { title: string; desc: string; social: string; location: string; locationVal: string; copyright: string };
  projects: { title: string; description: string; tags: string[] }[];
  certifications: { name: string; issuer: string; date: string }[];
}

interface Project {
  title: string;
  description: string;
  tags: string[];
  image: string;
  link: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  icon: React.ReactNode;
}

// --- Context ---
const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: Translation;
} | null>(null);

const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};

// --- Data ---
const TRANSLATIONS: Record<Language, Translation> = {
  zh: {
    nav: [
      { label: "關於我", id: "about" },
      { label: "作品集", id: "work" },
      { label: "數據", id: "certs" },
      { label: "聯繫我", id: "contact" }
    ],
    hero: {
      sub: "AI 氛圍開發者與設計師",
      title: "王培聿",
      collaborate: "讓我們開始合作"
    },
    about: {
      sub: "關於我",
      title: "個人背景",
      desc: "我在傳統產業擔任ＱＣ工程師／ＱＡ工程師待了接近13年的時間,雖然工作算穩定,但在2026年AI科技爆發性成長的這個時代,與時俱進似乎是不可避免的,與其擔心被AI取代,學習與AI共同成長並將其化為自己手中的武器,又或者說讓自己在AI時代保有個人價值才是現今最重要的課題。雖然目前仍在初步接觸的階段，但這個網站就是我邁出的第一步，很高興認識看到這邊的您，如果您對我感興趣，歡迎您聯繫我",
      design: "設計領域",
      designItems: "UI/UX 設計 • 品牌視覺 • 氛圍營造",
      dev: "開發技術",
      devItems: "React • Tailwind CSS • AI 整合"
    },
    portfolio: {
      sub: "精選項目",
      title: "過往作品",
      year: "2024 — 2026",
      viewCase: "查看詳情"
    },
    quote: {
      text: "每一小步，都是",
      highlight: "通往卓越",
      suffix: "的必經之路。"
    },
    gallery: {
      sub: "視覺展示",
      title: "作品剪影"
    },
    certs: {
      sub: "個人特質",
      title: "專業數據",
      stats: [
        { label: "經驗", value: "13年" },
        { label: "領域", value: "QA/QC" },
        { label: "轉型", value: "AI 開發" },
        { label: "所在地", value: "台灣 台中" },
        { label: "語言", value: "中文/英文" },
        { label: "狀態", value: "自由接案" }
      ]
    },
    footer: {
      title: "聯繫我",
      desc: "目前接受自由職業機會和全職職位。讓我們聯繫並討論您的下一個項目。",
      social: "社群媒體",
      location: "所在地",
      locationVal: "台灣 | 台中",
      copyright: "Jarvis Wang. 版權所有。"
    },
    projects: [],
    certifications: []
  },
  en: {
    nav: [
      { label: "About", id: "about" },
      { label: "Work", id: "work" },
      { label: "Stats", id: "certs" },
      { label: "Contact", id: "contact" }
    ],
    hero: {
      sub: "AI Vibe developer & designer",
      title: "Jarvis Wang",
      collaborate: "LET'S COLLABORATE"
    },
    about: {
      sub: "ABOUT ME",
      title: "A Brief Background",
      desc: "I spent nearly 13 years as a QC/QA Engineer in traditional industries. While stable, in this era of explosive AI growth in 2026, keeping pace is inevitable. Rather than fearing replacement, I believe in growing with AI and turning it into a tool to maintain personal value. Though still in the early stages, this website is my first step. Nice to meet you, and feel free to reach out if you're interested.",
      design: "DESIGN",
      designItems: "UI/UX Design • Brand Identity • Vibe Curation",
      dev: "DEVELOPMENT",
      devItems: "React • Tailwind CSS • AI Integration"
    },
    portfolio: {
      sub: "FEATURED PROJECTS",
      title: "Previous Work",
      year: "2024 — 2026",
      viewCase: "VIEW CASE"
    },
    quote: {
      text: "Every small step is a",
      highlight: "journey",
      suffix: "toward excellence."
    },
    gallery: {
      sub: "VISUALS",
      title: "Sample Shots"
    },
    certs: {
      sub: "STATS",
      title: "Measurements",
      stats: [
        { label: "Experience", value: "13 Years" },
        { label: "Field", value: "QA/QC" },
        { label: "Transition", value: "AI Dev" },
        { label: "Location", value: "Taichung, TW" },
        { label: "Languages", value: "ZH / EN" },
        { label: "Status", value: "Freelance" }
      ]
    },
    footer: {
      title: "Contact Me",
      desc: "Currently accepting freelance opportunities and full-time positions. Let's discuss your next project.",
      social: "SOCIAL",
      location: "LOCATION",
      locationVal: "Taichung | Taiwan",
      copyright: "Jarvis Wang. All rights reserved."
    },
    projects: [],
    certifications: []
  }
};

// --- Components ---

const Navbar = () => {
  const { lang, setLang, t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLang, setShowLang] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-brand-beige/80 backdrop-blur-md py-4" : "py-8"}`}>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex justify-between items-center">
        <a href="#" className="text-2xl font-serif tracking-tighter hover:opacity-70 transition-opacity">JARVIS</a>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-medium">
            {t.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="hover:text-brand-olive transition-colors">{item.label}</a>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowLang(!showLang)}
                className="p-2 hover:bg-brand-charcoal/5 rounded-full transition-colors"
              >
                <Globe className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showLang && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 bg-white border border-brand-charcoal/10 p-2 shadow-xl min-w-[100px]"
                  >
                    <button onClick={() => { setLang("zh"); setShowLang(false); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-brand-beige transition-colors ${lang === "zh" ? "text-brand-olive font-bold" : ""}`}>繁體中文</button>
                    <button onClick={() => { setLang("en"); setShowLang(false); }} className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-brand-beige transition-colors ${lang === "en" ? "text-brand-olive font-bold" : ""}`}>English</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img 
          src="https://picsum.photos/seed/editorial-hero/1920/1080" 
          alt="Hero" 
          className="w-full h-full object-cover grayscale opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-brand-beige/20" />
      </motion.div>

      <motion.div 
        style={{ opacity }}
        className="relative z-10 text-center"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="oval-highlight mb-8"
        >
          <h1 className="text-6xl md:text-9xl font-serif text-brand-charcoal">{t.hero.title}</h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] uppercase tracking-[0.6em] text-brand-charcoal mb-12 font-medium"
        >
          {t.hero.sub}
        </motion.p>
        <motion.a 
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] uppercase tracking-[0.3em] text-brand-charcoal border-b border-brand-charcoal pb-1 hover:opacity-50 transition-opacity"
        >
          {t.hero.collaborate}
        </motion.a>
      </motion.div>
    </section>
  );
};

const About = () => {
  const { t } = useTranslation();
  return (
    <section id="about" className="section-padding grid lg:grid-cols-2 gap-24 items-center bg-brand-beige">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative aspect-[4/5] image-border overflow-hidden"
      >
        <img 
          src="https://picsum.photos/seed/jarvis-about/800/1000" 
          alt={t.about.title} 
          className="w-full h-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-6xl md:text-8xl mb-12 leading-tight">{t.about.title}</h2>
        <p className="text-brand-charcoal/70 text-lg leading-relaxed mb-12 font-light">
          {t.about.desc}
        </p>
        <div className="grid grid-cols-2 gap-12 border-t border-brand-charcoal/10 pt-12">
          <div>
            <h4 className="text-brand-charcoal text-xs uppercase tracking-widest mb-4">{t.about.design}</h4>
            <p className="text-sm text-brand-charcoal/60 leading-relaxed">{t.about.designItems}</p>
          </div>
          <div>
            <h4 className="text-brand-charcoal text-xs uppercase tracking-widest mb-4">{t.about.dev}</h4>
            <p className="text-sm text-brand-charcoal/60 leading-relaxed">{t.about.devItems}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Portfolio = () => {
  const { t } = useTranslation();
  return (
    <section id="work" className="section-padding bg-brand-olive/10">
      <div className="grid lg:grid-cols-2 gap-24 items-start">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-6xl md:text-8xl mb-12 leading-tight">{t.portfolio.title}</h2>
          <p className="text-brand-charcoal/70 text-lg leading-relaxed mb-12 font-light max-w-md">
            My featured projects are a blend of technical precision and aesthetic vision, crafted to bridge the gap between human experience and AI potential.
          </p>
          <div className="text-brand-charcoal/40 uppercase tracking-[0.3em] text-[10px] font-medium">
            {t.portfolio.year}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="aspect-[3/4] image-border bg-brand-charcoal/5 flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
            </div>
            <div className="aspect-square image-border bg-brand-charcoal/5 flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
            </div>
          </div>
          <div className="pt-12 space-y-6">
            <div className="aspect-square image-border bg-brand-charcoal/5 flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
            </div>
            <div className="aspect-[3/4] image-border bg-brand-charcoal/5 flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const QuoteSection = () => {
  const { t } = useTranslation();
  return (
    <section className="section-padding bg-brand-beige">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1]"
        >
          {t.quote.text} <br />
          <span className="oval-highlight">{t.quote.highlight}</span> <br />
          {t.quote.suffix}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="aspect-[4/3] image-border overflow-hidden"
        >
          <img src="https://picsum.photos/seed/quote-img/800/600" alt="Quote" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
        </motion.div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const { t } = useTranslation();
  return (
    <section className="section-padding bg-brand-beige">
      <div className="flex flex-col items-center mb-24">
        <h2 className="text-6xl md:text-8xl text-center mb-4">{t.gallery.title}</h2>
        <span className="text-[10px] uppercase tracking-[0.4em] text-brand-charcoal/40">{t.gallery.sub}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <div className="aspect-[3/4] image-border bg-brand-charcoal/5 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50">Visual Experiment 01</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 0 }} whileInView={{ opacity: 1, y: -40 }} viewport={{ once: true }} className="space-y-4">
          <div className="aspect-square image-border bg-brand-charcoal/5 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50">Interface Study 02</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <div className="aspect-[3/4] image-border bg-brand-charcoal/5 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-charcoal/20">Coming Soon</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50">Brand Concept 03</p>
        </motion.div>
      </div>
    </section>
  );
};

const Stats = () => {
  const { t } = useTranslation();
  return (
    <section id="certs" className="section-padding bg-brand-beige">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="aspect-square image-border overflow-hidden"
        >
          <img src="https://picsum.photos/seed/stats-img/800/800" alt="Stats" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
        </motion.div>
        
        <div>
          <div className="grid grid-cols-2 gap-y-12 gap-x-8">
            {t.certs.stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/40 mb-2">{stat.label}</p>
                <p className="text-2xl font-serif">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer id="contact" className="bg-brand-beige">
      <div className="section-padding text-center">
        <h2 className="text-6xl md:text-9xl mb-16">{t.footer.title}</h2>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24 text-[10px] uppercase tracking-[0.3em] font-medium mb-24">
          <div className="text-center">
            <p className="text-brand-charcoal/40 mb-4">{t.footer.location}</p>
            <p>{t.footer.locationVal}</p>
          </div>
          <div className="text-center">
            <p className="text-brand-charcoal/40 mb-4">EMAIL</p>
            <a href="mailto:1215.yu.w@gmail.com" className="hover:text-brand-olive transition-colors">1215.yu.w@gmail.com</a>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-24">
          <a href="https://www.instagram.com/imjarviswang/" target="_blank" rel="noopener noreferrer" className="p-3 border border-brand-charcoal/10 rounded-full hover:bg-brand-charcoal hover:text-brand-beige transition-all"><Instagram className="w-5 h-5" /></a>
          <a href="https://www.facebook.com/DesireSmile/?locale=zh_TW" target="_blank" rel="noopener noreferrer" className="p-3 border border-brand-charcoal/10 rounded-full hover:bg-brand-charcoal hover:text-brand-beige transition-all"><Facebook className="w-5 h-5" /></a>
          <a href="https://www.threads.com/@imjarviswang?hl=zh-tw" target="_blank" rel="noopener noreferrer" className="p-3 border border-brand-charcoal/10 rounded-full hover:bg-brand-charcoal hover:text-brand-beige transition-all"><AtSign className="w-5 h-5" /></a>
        </div>
      </div>

      <div className="aspect-[21/9] w-full overflow-hidden">
        <img src="https://picsum.photos/seed/footer-img/1920/800" alt="Footer" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
      </div>

      <div className="py-8 px-6 text-center text-[9px] uppercase tracking-[0.4em] text-brand-charcoal/30">
        © 2026 {t.footer.copyright}
      </div>
    </footer>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>("zh");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Portfolio />
          <QuoteSection />
          <Gallery />
          <Stats />
        </main>
        <Footer />
      </div>
    </LanguageContext.Provider>
  );
}
