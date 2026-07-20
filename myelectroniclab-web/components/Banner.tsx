// Version: 1.3
// Title: Site Banner | Change from v1.2: added my-2 - now that AppShell v2.2
// centers the banner absolutely over the nav-button row (instead of its own
// flex-col row), the banner is taller than that row and was overflowing
// symmetrically above/below it with zero breathing room - looked glued to the
// header's top edge and to the search bar right below it. The margin pushes
// it in from both sides while staying centered. Important Data: still block
// display to avoid inline baseline gap.

export default function Banner() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
      alt="MyElectronicLab"
      className="mx-auto my-2 block h-auto w-[160px] self-center sm:w-[220px] md:w-[300px]"
    />
  );
}
