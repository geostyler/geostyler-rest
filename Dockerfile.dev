FROM oven/bun

COPY . .

RUN bun install

ENTRYPOINT ["bun"]

CMD ["--watch", "src/index.ts"]
