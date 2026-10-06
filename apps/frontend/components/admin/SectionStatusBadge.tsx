interface SectionStatusBadgeProps {
  isVisible: boolean;
}

export default function SectionStatusBadge({
  isVisible
}: SectionStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
        isVisible
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
      ].join(" ")}
      aria-label={isVisible ? "Section active" : "Section inactive"}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isVisible ? "bg-emerald-500" : "bg-slate-400"
        ].join(" ")}
        aria-hidden="true"
      />
      {isVisible ? "Active" : "Hidden"}
    </span>
  );
}
