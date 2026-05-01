import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Users,
  MessagesSquare,
  Star,
  Search,
  UserCircle,
} from "lucide-react";
import campusBg from "@/assets/campus.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Forge — De La Salle Lipa Thesis Repository" },
      {
        name: "description",
        content:
          "Share, archive, and discuss academic thesis work. Tag co-authors, upload PDFs, host open discussions.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "PDF Archive",
    body: "Upload and host your research paper. Every version preserved, every byte secure.",
    accent: "from-primary/20 to-emerald-500/10",
  },
  {
    icon: Users,
    title: "Tag Your Co-Authors",
    body: "Search your collaborators and credit them properly. Authorship made clear for everyone.",
    accent: "from-sky-500/15 to-primary/10",
  },
  {
    icon: MessagesSquare,
    title: "Open Discussions",
    body: "Every thesis comes with a live comment thread. Ask questions, challenge ideas, exchange knowledge.",
    accent: "from-violet-500/15 to-primary/10",
  },
  {
    icon: Star,
    title: "Star What Matters",
    body: "Bookmark work that moves you. Top-starred research earns a spot on the Featured page.",
    accent: "from-amber-500/15 to-primary/10",
  },
  {
    icon: UserCircle,
    title: "Researcher Profiles",
    body: "Build your academic identity in one place. Portfolio, affiliations, and contact info all visible.",
    accent: "from-rose-500/15 to-primary/10",
  },
  {
    icon: Search,
    title: "Find Anything",
    body: "Full-text search across titles, abstracts, departments, and authors. Your next reference is one query away.",
    accent: "from-teal-500/15 to-primary/10",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Index() {
  const featuresSection = useInView(0.05);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url(${campusBg})`,
            willChange: "transform",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.12 0.006 240 / 0.78) 0%, oklch(0.12 0.006 240 / 0.85) 55%, oklch(0.12 0.006 240 / 0.98) 88%, oklch(0.12 0.006 240) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 0%, oklch(0.10 0.005 240 / 0.55) 70%, oklch(0.08 0.005 240 / 0.95) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.82 0.22 145 / 0.22), transparent 70%)",
          }}
        />

        <div
          className="relative mx-auto max-w-5xl px-6 pt-44 pb-32 md:pt-52 md:pb-40 text-center"
          style={{ animation: "forge-fade-up 0.7s ease both" }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md px-3 py-1 text-xs text-primary mb-8"
            style={{ animation: "forge-fade-up 0.6s ease both" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            De La Salle Lipa
          </div>
          <h1
            className="text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]"
            style={{ animation: "forge-fade-up 0.75s 0.05s ease both" }}
          >
            A Modern Home for{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-300 to-primary bg-clip-text text-transparent">
              Academic Work
            </span>
            .
          </h1>
          <p
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
            style={{ animation: "forge-fade-up 0.75s 0.12s ease both" }}
          >
            Upload your thesis, credit every co-author, host an open discussion.
            Built for researchers who want their work read, cited, and challenged.
          </p>
          <div
            className="mt-10 flex flex-wrap justify-center gap-3"
            style={{ animation: "forge-fade-up 0.75s 0.2s ease both" }}
          >
            <Link to="/explore">
              <Button
                size="lg"
                className="shadow-[0_0_32px_-4px_var(--primary)] transition-all duration-300 hover:shadow-[0_0_40px_-2px_var(--primary)] hover:scale-[1.03]"
              >
                Browse Works <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="transition-all duration-300 hover:scale-[1.03] hover:border-primary/50"
              >
                Submit a Thesis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section
        ref={featuresSection.ref}
        className="mx-auto max-w-5xl px-6 pb-28 -mt-8 relative z-10"
      >
        <div className="grid md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-border bg-card p-6 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_28px_-6px_var(--primary)] hover:-translate-y-0.5"
              style={{
                boxShadow: "var(--shadow-sm)",
                opacity: featuresSection.visible ? 1 : 0,
                transform: featuresSection.visible
                  ? "translateY(0)"
                  : "translateY(20px)",
                transition: `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s, border-color 0.3s, box-shadow 0.3s`,
              }}
            >
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}
              />
              <div className="relative">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors duration-200">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
