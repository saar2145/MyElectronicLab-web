// Version: 1.4
// Title: Site Banner | Change from v1.3: my-2 → my-3, paired with AppShell v2.3's
// explicit min-height on the row (which is the part that actually matters -
// v1.3's my-2 rendered invisibly because the row had no spare room to show it,
// see chat). Important Data: still block display to avoid inline baseline gap.

export default function Banner() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
      alt="MyElectronicLab"
      className="mx-auto my-3 block h-auto w-[160px] self-center sm:w-[220px] md:w-[300px]"
    />
  );
}
