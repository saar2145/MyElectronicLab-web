// Version: 1.1
// Title: Site Banner | Important Data: reduced sizing (260px desktop, 150px mobile)
// vs v1.0's 380/180 - header was taking up too much vertical space. block display
// (not inline default) removes the small baseline gap that <img> has by default,
// which was causing an odd-looking space above/below the banner.

export default function Banner() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
      alt="MyElectronicLab"
      className="mx-auto block h-auto w-[140px] sm:w-[200px] md:w-[260px]"
    />
  );
}
