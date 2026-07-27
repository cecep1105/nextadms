/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output MINIMAL & SELF-CONTAINED (cuma node_modules yang BENAR-BENAR
  // dipakai, ditelusuri otomatis dari import) -- jauh lebih kecil drpd
  // copy node_modules penuh ke image Docker. Lihat docker/nextjs/Dockerfile.
  output: "standalone",
};

export default nextConfig;
