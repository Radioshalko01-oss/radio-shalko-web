import { Music, HeartHandshake, Wrench } from "lucide-react";

const ITEMS = [
  {
    icon: Music,
    title: "40 años de experiencia",
    desc: "Más de cuatro décadas acompañando a músicos, artistas y nuevas generaciones con instrumentos seleccionados por su calidad, sonido y esencia.",
  },
  {
    icon: HeartHandshake,
    title: "Asesoría especializada",
    desc: "Recomendaciones honestas y personalizadas para ayudarte a encontrar el instrumento ideal según tu estilo, nivel y visión musical.",
  },
  {
    icon: Wrench,
    title: "Taller técnico profesional",
    desc: "Calibración, ajuste y mantenimiento especializado para instrumentos y equipo de audio, realizados con precisión y experiencia profesional.",
  },
];

export function StoryStrip() {
  return (
    <section className="border-b border-border bg-background py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <ul className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {ITEMS.map((item) => (
            <li
              key={item.title}
              className="md:px-6 md:first:pl-0 md:last:pr-0 lg:px-10 lg:first:pl-0 lg:last:pr-0"
            >
              <div className="flex h-full flex-col items-center gap-2.5 text-center md:gap-2">
                <div className="flex items-center justify-center gap-2.5">
                  <item.icon
                    className="h-[18px] w-[18px] shrink-0 text-foreground"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-foreground md:text-lg">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-[1.65] text-muted-foreground md:text-[15px]">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
