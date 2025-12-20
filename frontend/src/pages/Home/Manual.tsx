"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ThemeSwitcher } from "frontend/src/components/theme-switcher";
import { Button } from "frontend/src/components/ui/button";
import { ScrollArea } from "frontend/src/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "frontend/src/components/ui/sheet";
import { useIsMobile, useTheme } from "frontend/src/hooks";
import { cn } from "frontend/src/lib/utils";
import { Menu, Key, User, Shield, Settings, BarChart, Eye, Code, GitBranch, Database, AlertTriangle, Lock } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Heading {
  id: string;
  text: string;
  level: number;
  icon?: string;
}

interface MarkdownManualProps {
  content: string;
}

export default function MarkdownManual({ content }: MarkdownManualProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<Record<string, HTMLElement>>({});
  const isMobile = useIsMobile();
  const { theme, isDark, applyTheme } = useTheme();

  useEffect(() => {
    applyTheme(theme, isDark);
  }, [theme, isDark, applyTheme]);

  // Extract headings from markdown content
  useEffect(() => {
    const extractHeadings = (markdown: string) => {
      const headingRegex = /^(## |### )(.+)$/gm;
      const extractedHeadings: Heading[] = [];
      let match;

      while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].trim() === "##" ? 2 : 3;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");

        // Determine icon based on heading text (simplified logic)
        let icon = "";
        if (text.toLowerCase().includes("conexión") || text.toLowerCase().includes("github")) {
          icon = "github";
        } else if (text.toLowerCase().includes("datos") || text.toLowerCase().includes("administrador")) {
          icon = "user";
        } else if (text.toLowerCase().includes("roles")) {
          icon = "shield";
        } else if (text.toLowerCase().includes("metadatos") || text.toLowerCase().includes("equipo")) {
          icon = "database";
        } else if (text.toLowerCase().includes("seguridad")) {
          icon = "lock";
        } else if (text.toLowerCase().includes("dashboard")) {
          icon = "chart";
        }

        extractedHeadings.push({ id, text, level, icon });
      }

      return extractedHeadings;
    };

    setHeadings(extractHeadings(content));
  }, [content]);

  // Set up intersection observer to track active heading
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "0px 0px -80% 0px",
        threshold: 0.1,
      },
    );

    // Observe all heading elements
    const elements = contentRef.current.querySelectorAll("h2, h3");
    elements.forEach((element) => {
      headingRefs.current[element.id] = element as HTMLElement;
      observer.observe(element);
    });

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, [content, headings]);

  // Scroll to heading when clicked in TOC
  const scrollToHeading = (id: string) => {
    const element = headingRefs.current[id];
    if (element) {
      // Set active ID immediately for better visual feedback
      setActiveId(id);
      
      // Close mobile sidebar if it's open
      if (isMobile) {
        const sheetCloseButton = document.querySelector('[data-radix-collection-item]');
        if (sheetCloseButton && sheetCloseButton instanceof HTMLElement) {
          sheetCloseButton.click();
        }
      }
      
      // Scroll with a slight delay to ensure UI updates first
      setTimeout(() => {
        window.scrollTo({
          top: element.offsetTop - 80, // Reduced offset for better positioning
          behavior: "smooth",
        });
      }, 100);
    }
  };

  // Get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "github":
        return <GitBranch className="h-4 w-4 mr-2" />;
      case "user":
        return <User className="h-4 w-4 mr-2" />;
      case "shield":
        return <Shield className="h-4 w-4 mr-2" />;
      case "settings":
        return <Settings className="h-4 w-4 mr-2" />;
      case "chart":
        return <BarChart className="h-4 w-4 mr-2" />;
      case "eye":
        return <Eye className="h-4 w-4 mr-2" />;
      case "code":
        return <Code className="h-4 w-4 mr-2" />;
      case "database":
        return <Database className="h-4 w-4 mr-2" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 mr-2" />;
      case "lock":
        return <Lock className="h-4 w-4 mr-2" />;
      case "key":
        return <Key className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ node, ...props }: any) => {
      const id = props.children
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      return <h1 id={id} className="scroll-mt-20 text-primary text-3xl lg:text-4xl font-bold mb-6" {...props} />;
    },
    h2: ({ node, ...props }: any) => {
      const id = props.children
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      const heading = headings.find((h) => h.id === id);
      const icon = heading?.icon ? getIconComponent(heading.icon) : null;

      return (
        <h2 id={id} className="scroll-mt-20 text-primary/80 text-2xl font-semibold mt-8 mb-4 flex items-center" {...props}>
          {icon}
          {props.children}
        </h2>
      );
    },
    h3: ({ node, ...props }: any) => {
      const id = props.children
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      const heading = headings.find((h) => h.id === id);
      const icon = heading?.icon ? getIconComponent(heading.icon) : null;

      return (
        <h3 id={id} className="scroll-mt-20 text-secondary text-xl font-medium mt-6 mb-3 flex items-center" {...props}>
          {icon}
          {props.children}
        </h3>
      );
    },
    p: ({ node, ...props }: any) => {
      return <p className="my-3 leading-relaxed" {...props} />;
    },
    ul: ({ node, ...props }: any) => {
      return <ul className="list-disc pl-6 my-4 space-y-2" {...props} />;
    },
    ol: ({ node, ...props }: any) => {
      return <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />;
    },
    li: ({ node, ...props }: any) => {
      return <li className="pl-1" {...props} />;
    },
    a: ({ node, ...props }: any) => {
      return <a className="text-blue-500 hover:underline" {...props} />;
    },
    blockquote: ({ node, ...props }: any) => {
      return <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 italic" {...props} />;
    },
    table: ({ node, ...props }: any) => {
      return (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700" {...props} />
        </div>
      );
    },
    thead: ({ node, ...props }: any) => {
      return <thead className="bg-gray-100 dark:bg-card" {...props} />;
    },
    tbody: ({ node, ...props }: any) => {
      return <tbody className="divide-y divide-gray-300 dark:divide-gray-700" {...props} />;
    },
    tr: ({ node, ...props }: any) => {
      return <tr className="hover:bg-gray-50 dark:hover:bg-gray-900" {...props} />;
    },
    th: ({ node, ...props }: any) => {
      return <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300" {...props} />;
    },
    td: ({ node, ...props }: any) => {
      return <td className="px-4 py-3 border-t border-gray-300 dark:border-gray-700" {...props} />;
    },
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-md my-4" {...props}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={cn("bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
          {children}
        </code>
      );
    },
    strong: ({ node, ...props }: any) => {
      return <strong className="font-semibold" {...props} />;
    },
    em: ({ node, ...props }: any) => {
      return <em className="italic" {...props} />;
    },
    hr: ({ node, ...props }: any) => {
      return <hr className="my-6 border-t border-gray-300 dark:border-gray-700" {...props} />;
    },
    img: ({ node, ...props }: any) => {
      return <img className="max-w-full h-auto rounded-md my-4" alt={props.alt || ""} {...props} />;
    },
  };

  // Table of Contents component
  const TableOfContents = () => (
    <div className="w-full">
      <ThemeSwitcher className="mb-4 w-full px-3" />
      <h3 className="mb-4 text-lg font-semibold px-2">Table of Contents</h3>
      <ul className="space-y-1 w-full">
        {headings.map((heading) => (
          <li key={heading.id} className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-2 text-left flex items-center",
                heading.level === 3 && "pl-6",
                activeId === heading.id ? "bg-cyan-500/10 text-cyan-500 font-medium" : "text-muted-foreground",
              )}
              onClick={() => scrollToHeading(heading.id)}>
              {heading.icon && getIconComponent(heading.icon)}
              <span className="truncate">{heading.text}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle table of contents</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0 bg-gray-950 text-white">
            <ScrollArea className="h-[calc(100vh-4rem)] py-4 px-2 w-full">
              <TableOfContents />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="hidden md:block w-64 lg:w-80 shrink-0 h-screen sticky top-0 border-r border-border bg-gray-950 text-white">
          <ScrollArea className="h-screen py-8 px-2">
            <TableOfContents />
          </ScrollArea>
        </div>
      )}

      {/* Main content */}
      <div ref={contentRef} className="flex-1 px-4 md:px-8 py-12 max-w-4xl mx-auto">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
