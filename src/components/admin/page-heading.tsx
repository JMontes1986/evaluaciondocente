export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b pb-6"><div><p className="text-sm font-semibold text-primary">{eyebrow}</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>{children}</div>;
}
