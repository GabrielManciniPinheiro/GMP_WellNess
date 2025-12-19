"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollProps {
  children: React.ReactNode;
  showArrowsOnMobile?: boolean;
}

const HorizontalScroll = ({ children }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Ajustei a tolerância para 2px para ser mais preciso
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -300 : 300;

      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 500);
    }
  };

  // Base da seta
  const arrowBaseClass =
    "absolute top-0 bottom-0 z-20 w-12 flex items-center justify-center transition-all duration-300 opacity-100";

  return (
    <div className="group relative w-full">
      {/* FAIXA ESQUERDA - Gradiente vindo do Background */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          // MUDANÇA 1: Gradiente usa 'from-background' (seu off-white) para transparente
          className={`${arrowBaseClass} left-0 rounded-l-lg bg-gradient-to-r from-background via-background/80 to-transparent`}
        >
          {/* MUDANÇA 2: Cor da seta agora é 'text-primary' (Salmão) */}
          <ChevronLeft
            className="h-8 w-8 text-primary transition-transform hover:scale-110"
            strokeWidth={2}
          />
        </button>
      )}

      {/* ÁREA DE CONTEÚDO */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* FAIXA DIREITA - Gradiente vindo do Background */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          // MUDANÇA 1: Gradiente invertido (to-l) vindo do background
          className={`${arrowBaseClass} right-0 rounded-r-lg bg-gradient-to-l from-background via-background/80 to-transparent`}
        >
          {/* MUDANÇA 2: Cor da seta agora é 'text-primary' */}
          <ChevronRight
            className="h-8 w-8 text-primary transition-transform hover:scale-110"
            strokeWidth={2}
          />
        </button>
      )}
    </div>
  );
};

export default HorizontalScroll;
