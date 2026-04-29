// Server-only entrypoint: anything that touches env (OpenAI/Anthropic clients,
// encryption with the master key) lives here. Client components must NOT import
// from this path.

export { encryptToken, decryptToken } from "./secure";
export {
  embedTexts,
  embedQuery,
  EMBEDDING_MODEL,
  EMBEDDING_DIMS,
} from "./embed";
export {
  fetchAndEmbedRepoFiles,
  type IndexedFile,
} from "./index-files";
