"use client";

import { useState } from "react";

export function JKSwitch({
  name = "jenisKelamin",
  defaultValue,
}: {
  name?: string;
  defaultValue?: "L" | "P" | null;
}) {
  const [val, setVal] = useState<"L" | "P">(
    defaultValue === "P" ? "P" : "L",
  );

  return (
    <div>
      <input type="hidden" name={name} value={val} />
      <div className="flex overflow-hidden rounded-lg border border-gray-300">
        <button
          type="button"
          onClick={() => setVal("L")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            val === "L"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>♂</span> Laki-laki
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => setVal("P")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            val === "P"
              ? "bg-pink-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>♀</span> Perempuan
        </button>
      </div>
    </div>
  );
}
