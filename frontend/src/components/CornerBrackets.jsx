export function CornerBrackets({ color = "#22c8b855", size = 12 }) {
  const base = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    borderStyle: "solid",
  };
  return (
    <>
      <div style={{ ...base, top: -1, left: -1, borderWidth: "2px 0 0 2px" }} />
      <div
        style={{ ...base, top: -1, right: -1, borderWidth: "2px 2px 0 0" }}
      />
      <div
        style={{ ...base, bottom: -1, left: -1, borderWidth: "0 0 2px 2px" }}
      />
      <div
        style={{ ...base, bottom: -1, right: -1, borderWidth: "0 2px 2px 0" }}
      />
    </>
  );
}
