FROM oven/bun:1.3.12-alpine AS builder

WORKDIR /app

COPY package.json bun.lock wrangler.jsonc tsconfig.json ./
COPY src ./src

RUN bun install --frozen-lockfile
RUN bunx wrangler deploy --dry-run --outdir=dist-oci

FROM node:25-slim AS runtime
ARG TARGETARCH

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    case "${TARGETARCH}" in \
      amd64) WORKERD_PKG="@cloudflare/workerd-linux-64" ;; \
      arm64) WORKERD_PKG="@cloudflare/workerd-linux-arm64" ;; \
      *) echo "Unsupported TARGETARCH: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    npm install -g "${WORKERD_PKG}" && \
    ln -s "/usr/local/lib/node_modules/${WORKERD_PKG}/bin/workerd" /usr/local/bin/workerd

WORKDIR /worker

COPY --from=builder /app/dist-oci ./dist-oci
COPY config.capnp ./config.capnp

RUN mkdir -p /var/lib/paseo-relay/do && \
    chown -R node:node /worker /var/lib/paseo-relay

VOLUME ["/var/lib/paseo-relay/do"]
EXPOSE 8080
USER node

CMD ["workerd", "serve", "config.capnp", "--directory-path", "relay-storage=/var/lib/paseo-relay/do"]
