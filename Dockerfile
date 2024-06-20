FROM oven/bun

COPY . .

RUN bun install

ENTRYPOINT ["bun"]

CMD ["src/index.ts"]
