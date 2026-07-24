# syntax=docker/dockerfile:1
#
# Multi-stage build -- beda dari Django (kode Next.js DIBUNGKUS ke dalam
# image saat build, BUKAN bind-mount), krn user cuma minta mode-dev
# dipertahankan utk Django. Next.js production build lazimnya memang
# dibangun jadi image immutable spt ini.
#
# PENTING soal env var: `NEXT_PUBLIC_*` di-INLINE ke bundle JS client
# SAAT BUILD (next build), BUKAN dibaca saat runtime -- makanya harus
# dikirim sbg build ARG (lihat docker-compose.yml `build.args`), BUKAN
# cuma `environment:` runtime biasa (itu TIDAK akan berpengaruh apa-apa
# ke kode yang sudah ke-compile ke bundle statis).

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js TIDAK mewajibkan folder `public/` ada -- tapi COPY di stage
# `runner` (di bawah) MEWAJIBKAN source-nya ada, jadi jamin folder ini
# ADA di sini (walau kosong) supaya build TIDAK gagal kalau project belum
# punya asset statis apa pun (favicon, dst) di public/.
RUN mkdir -p public

# Build-time args -- WAJIB utk NEXT_PUBLIC_* (lihat catatan di atas).
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_BASE_URL=$NEXT_PUBLIC_WS_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# NEXTAUTH_SECRET TIDAK perlu ada saat build (cuma dipakai runtime, server-side) --
# tapi next build kadang tetap butuh env var ADA (boleh isi placeholder) supaya tidak warning.
ENV NEXTAUTH_SECRET=build-placeholder-diganti-runtime
ENV NEXTAUTH_URL=http://localhost:3000

RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# User non-root -- praktik baik container production, biarpun ini "cuma"
# test production (kebiasaan yang sama dipakai nanti pas production sungguhan).
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]