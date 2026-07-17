// Version: 1.0
// Title: Site Banner | Important Data: same banner image + sizing (380px desktop,
// 180px mobile) as original Index.html header.

export default function Banner() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
      alt="MyElectronicLab"
      className="mx-auto h-auto w-[180px] sm:w-[280px] md:w-[380px]"
    />
  );
}
