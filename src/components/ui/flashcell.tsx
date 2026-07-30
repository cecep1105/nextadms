import { useEffect, useRef, useState } from "react";

type FlashCellProps = {
  value: React.ReactNode;
  className?: string;
  flashClassName?: string;
};

export default function FlashCell({
  value,
  className = "",
  flashClassName = "bg-yellow-300",
}: FlashCellProps) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);

      const timer = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <td
      className={`${className} transition-colors duration-500 ${
        flash ? flashClassName : ""
      }`}
    >
      {value}
    </td>
  );
}