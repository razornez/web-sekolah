import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(145deg, #1a2e4a 0%, #243f66 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          position: "relative",
        }}
      >
        {/* Atap segitiga sekolah */}
        <div
          style={{
            position: "absolute",
            top: 5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "8px solid #c9a84c",
          }}
        />
        {/* Bangunan */}
        <div
          style={{
            position: "absolute",
            bottom: 5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 18,
            height: 14,
            background: "#c9a84c",
            borderRadius: "1px 1px 2px 2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Pintu */}
          <div
            style={{
              width: 5,
              height: 8,
              background: "#1a2e4a",
              borderRadius: "2px 2px 0 0",
              marginTop: "auto",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
