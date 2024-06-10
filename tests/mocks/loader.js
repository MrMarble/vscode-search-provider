export function resolve(ident, context, nextResolver) {
  if (ident.startsWith("gi://")) {
    return nextResolver("../tests/mocks/gnome.ts", context);
  }
  return nextResolver(ident, context);
}
