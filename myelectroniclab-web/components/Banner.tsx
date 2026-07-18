// Version: 1.2
// Title: Site Banner | Important Data: slightly increased sizing (300px desktop,
// 160px mobile) per user request - v1.1's 260/140 felt too small once nav buttons
// were also enlarged. Still block display to avoid inline baseline gap.

export default function Banner() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
      alt="MyElectronicLab"
      className="mx-auto block h-auto w-[160px] sm:w-[220px] md:w-[300px]"
    />
  );
}
