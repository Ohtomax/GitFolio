import { z } from 'zod';

export const GeneratedFileSchema = z.object({ path: z.string().max(160).regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/),
  content: z.string().max(2000000) }).strict();
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export function validateArtifact(files: GeneratedFile[]): GeneratedFile[] {
  z.array(GeneratedFileSchema).min(1).max(30).parse(files);
  if (new Set(files.map((file) => file.path)).size !== files.length || files.some((file) => file.path.includes('//') || file.path.includes('\\'))
    || files.reduce((bytes, file) => bytes + Buffer.byteLength(file.content), 0) > 4000000) throw new Error('Invalid generated artifact');
  return files;
}
