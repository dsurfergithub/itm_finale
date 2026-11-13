let count = 0;
let previous = "";
export function lockBody() {
  if (count++ === 0) {
    previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  return () => {
    if (--count === 0) document.body.style.overflow = previous;
  };
}
